"""
NeuraSense Stroke Detection Algorithm for OpenBCI data
Version: 0.3
Date Last Updated: March 22, 2025

This algorithm takes in real-time eeg data from the Open BCI headset and outputs whether a patient may have had a stroke. 
"""

# Imports
import mne
import numpy as np
import os
import matplotlib.pyplot as plt
import pandas as pd
import json
import re
from queue import Queue

# HELPER FUNCTIONS

# BUFFER_SIZE = 750 # 30s of frames at 200 Hz (Assuming 1 frame at 200 Hz) = 30 s x 200 Hz/s = 6000 frames 
BUFFER_SIZE = 100 # Testing buffer size
data_queue = Queue(maxsize = BUFFER_SIZE) # Initialize Queue

def collect_data(packet):
    """
    This method collects 30 seconds worth of frames from the NeuraSense application for analysis.
    To use this method, data must be continuously sent to this method and return values must be checked prior to sending data for processing.

    Parameters:
    - Packet: Frame sent by the NeuraSense app.

    Returns:
    - data_chunk: if Queue is full. This is an array with 6000 entries (30s of data) to serve as an input to the processing_data() method.
    - None: if Queue is not full
    """
    packet = json.loads(packet)
    state = packet['isPhantom']

    if data_queue.full():

            # Size should be BUFFER_SIZE
        size = data_queue.qsize() 

        # Initialize array to collect data chunk
        data_chunk = [] 

         # Dequeue frames to gather one data chunk for processing
        for i in range(size):
            data_chunk.append(data_queue.get_nowait()) 

        # Clear queue to collect next 30s of data
        data_queue.queue.clear() 

        # Send data chunk for processing
        return data_chunk, state

    else:
        # Add packets to queue until it fills up
        data_queue.put(packet['packet'])
        return None, None

def processing_data (data, state):

    num_channels = len(data[0]["data"])  # Assuming all JSONs have the same number of channels
    concatenated_data = [[] for _ in range(num_channels)]  # List of lists for each channel

    # Append corresponding channel samples from each JSON object
    for entry in data:
        for ch_idx in range(num_channels):
            concatenated_data[ch_idx].extend(entry["data"][ch_idx])  # Concatenate channel-wise data

    # Convert to a NumPy array
    data_array = np.array(concatenated_data)  # Shape: (n_channels, n_times)

    # Create MNE raw object
    sfreq = 200  # Set the sampling frequency in Hz (Modify as needed)
    ch_names = [f"channel_{i+1}" for i in range(num_channels)]
    ch_types = ["eeg"] * num_channels  # Set channel types

    info = mne.create_info(ch_names=ch_names, sfreq=sfreq, ch_types=ch_types)
    raw_mne_data = mne.io.RawArray(data_array, info)
    #raw_mne_data.set_eeg_reference(ref_channels=['Cz']) # Need to determine how reference channel will be communicated and update

    # Computing psds (mean band power)
    channels = raw_mne_data.info['ch_names'] ##May need to update when using reference
    #[channel_1, channel_2, channel_3, channel_4]
    psds_dict = find_psd(raw_mne_data, channels=channels)
    
    # Computing band power ratios DAR, DBR
    band_ratios = ratios(psds_dict)
    
    # Compute Average Relative Band Power
    relative_band_power = rbp(raw_mne_data, psds_dict, channels=channels)

    # Compute asymmetry metrics
    # Define odd (left) and even (right) channels
    odd = ['channel_1', 'channel_2']
    even = ['channel_3', 'channel_4']

    relative_diff, hemispheric_index = asymmetry_metrics(odd = odd, even = even, data = raw_mne_data)

    # Conduct stroke assessment with flag-based algorithm
    if state == True: 
        result, flag_descriptions = stroke_assessment(ratios = band_ratios, rbp = relative_band_power, rd = relative_diff, hi = hemispheric_index)

        processed_data = {
            "DAR": round(band_ratios['DAR'], 2),
            "DBR": round(band_ratios['DBR'], 2),
            "RBP_Alpha": round(relative_band_power['Alpha'], 2),
            "RBP_Beta": round(relative_band_power['Beta'], 2),
            "RD_Alpha": round(relative_diff['Alpha'], 2),
            "RD_Beta": round(relative_diff['Beta'], 2),
            "HI_Alpha": round(hemispheric_index['Alpha'], 2),
            "HI_Beta": round(hemispheric_index['Beta'], 2),
            "stroke": result,
            "ratio_flag": flag_descriptions[0],
            "rbpb_flag": flag_descriptions[1],
            "rbpa_flag": flag_descriptions[2],
            "rda_flag": flag_descriptions[3],
            "rdb_flag": flag_descriptions[4],
            "hia_flag": flag_descriptions[5],
            "hib_flag": flag_descriptions[6],
        }
    else:
        processed_data = {
            "DAR": round(band_ratios['DAR'], 2),
            "DBR": round(band_ratios['DBR'], 2),
            "RBP_Alpha": round(relative_band_power['Alpha'], 2),
            "RBP_Beta": round(relative_band_power['Beta'], 2),
            "RD_Alpha": round(relative_diff['Alpha'], 2),
            "RD_Beta": round(relative_diff['Beta'], 2),
            "HI_Alpha": round(hemispheric_index['Alpha'], 2),
            "HI_Beta": round(hemispheric_index['Beta'], 2),
            "stroke": 0,
            "ratio_flag": "Normal",
            "rbpb_flag": "Normal",
            "rbpa_flag": "Normal",
            "rda_flag": "Normal",
            "rdb_flag": "Normal",
            "hia_flag": "Normal",
            "hib_flag": "Normal",
        }

        # result = 0 
        # ratio_flag = "DAR & DBR are normal"
        # rbpb_flag = "Relative band power (beta) is normal"
        # rbpa_flag = "Relative band power (alpha) is normal"
        # rda_flag = "Relative difference (alpha) is normal"
        # rdb_flag = "Relative difference (beta) is normal"
        # hia_flag = "Hemispheric index (alpha) is normal"
        # hib_flag = "Hemispheric index (beta) is normal"

    return processed_data

    # return DAR, DBR, RBP_Alpha, RBP_Beta, RD_Alpha, RD_Beta, HI_Alpha, HI_Beta, result, ratio_flag, rbpb_flag, rbpa_flag, rda_flag, rdb_flag, hia_flag, hib_flag


def find_psd(input_data, channels):
    """
    Determine the power spectral density (PSD) for specific frequency bands (Delta, Theta, Alpha, Beta)
    for selected channels.

    Parameters:
        - input_data: MNE Raw object
        - channels: List of channel names to analyze (e.g., ['F3', 'C3', 'Cz']).

    Return:
        - psds: dictionary with Delta, Alpha, Beta psds per channel
    """
    # Define a dictionary with bands and their frequencies
    bands = { 
        'Delta': (0.5, 4),
        'Theta': (4, 8),
        'Alpha': (8, 13),
        'Beta': (13, 30)
    }
    
    # Work on a copy of the data to avoid modifying the original
    selected = input_data.copy().pick_channels(channels)

    # Prepare a dictionary to store band powers
    psds = {band: [] for band in bands}
   
    # Compute Mean Band Power for each band
    for band_name, (fmin, fmax) in bands.items():
        psd = selected.compute_psd(method='welch', fmin=fmin, fmax=fmax)

        # Mean power across frequencies for each channel
        psds[band_name] = [psd.get_data(i).mean() for i in range(len(channels))]
    
    return psds # Format - dictionary; 'Band': values per channel

def ratios(data):
    """
    Computes the average band power ratios across all channels.

    Parameters: 
    - data: dictionary of PSD values from find_psds function above.

    Returns:
    - Dictionary of ratios containing DAR and DBR
    """
    # Initialize dictionary for storing results
    ratios = {} 

    # Compute ratios per channels
    dar_per_channel = [delta / alpha for delta, alpha in zip(data['Delta'], data['Alpha'])]
    dbr_per_channel = [delta / beta for delta, beta in zip(data['Delta'], data['Beta'])]

    # Compute average DAR and DBR across all channels
    ratios = {
        "DAR": np.average(dar_per_channel),
        "DBR": np.average(dbr_per_channel)
    }

    return ratios

def rbp(raw_data, data, channels):
    """
    Computes the relative band power (averaged over all channels)
    
    Intermediate calculations for absolute power and total power required

    Parameters:
    - data: Dictionary containing the mean band powers (from find_psd function above)

    Returns:
    - Dictionary of (Average) Relative Band Power: dictionary with 'band_name': RBP 
    """
    # Initialize dictionaries for storing intermediate results
    abs_band_power = {}
    rel_band_power = {}

    # Extract signal parameters
    signal_frequency = raw_data.info['sfreq']
    time_points = len(raw_data[0][1])
    signal_duration = time_points / signal_frequency
    
    # Compute Absolute Band Power (Mean Band Power * Signal Duration)
    abs_band_power = {
        band: [power * signal_duration for power in powers] 
        for band, powers in data.items()
    }

    # Compute Total Power per Channel (sum across bands)
    total_power_per_channel = [
        sum(band[i] for band in abs_band_power.values()) 
        for i in range(len(channels))
    ]

    # Compute Relative Band Power (Absolute Power / Total Power)
    rel_band_power = {
    band: [abs_power[i] / total_power_per_channel[i] for i in range(len(channels))] 
    for band, abs_power in abs_band_power.items()
    }
    
    # Compute Average Relative Band Power across channels
    average_relative_band_power = {
        band: np.mean(values) for band, values in rel_band_power.items()
    }
    
    return average_relative_band_power

def asymmetry_metrics(odd, even, data):
    """
    Computes the asymmetry index in terms of Relative Difference

    Parameters: 
    - odd: list of odd channels
    - even: list of even channels
    - data:  MNE Raw object

    Returns:
    - alpha_rd: relative difference from alpha channels
    - beta_rd: relative difference from beta channels
    - alpha_hr: hemispheric ratio from alpha channels
    - beta_hr: hemispheric ratio from the beta channels
    """

    # Define a dictionary with relevant bands (alpha and beta) and their frequency ranges
    bands = { 
        'Alpha': (8, 13),
        'Beta': (13, 30)
    }
    # Work on a copy of the data to avoid modifying the original
    selected_odd = data.copy().pick_channels(odd)
    selected_even = data.copy().pick_channels(even)

    # Initialize dictionaries to store band powers and results
    psds_odd = {band: [] for band in bands}
    psds_even = {band: [] for band in bands}
    relative_diff = {}
    hemispheric_index = {}
    #psds = {band: [] for band in bands}
   
    # Compute Mean Band Power for each band
    for band_name, (fmin, fmax) in bands.items():
        psd_odd = selected_odd.compute_psd(method='welch', fmin=fmin, fmax=fmax)
        psd_even = selected_even.compute_psd(method='welch', fmin=fmin, fmax=fmax)

        # Mean power across frequencies for each channel
        psds_odd[band_name] = [psd_odd.get_data(i).mean() for i in range(len(odd))]
        psds_even[band_name] = [psd_even.get_data(i).mean() for i in range(len(even))]

    # Compute average across arrays
    avg_alpha_odd = np.average(psds_odd['Alpha'])
    avg_alpha_even = np.average(psds_even['Alpha'])
    avg_beta_odd = np.average(psds_odd['Beta'])
    avg_beta_even = np.average(psds_even['Beta'])
    
    # Compute Relative Difference
    relative_diff = {
        'Alpha': np.divide(np.abs(avg_alpha_odd - avg_alpha_even), np.add(avg_alpha_odd, avg_alpha_even)),
        'Beta': np.divide(np.abs(avg_beta_odd - avg_beta_even), np.add(avg_beta_odd, avg_beta_even))
    }
    
    # Compute sum across arrays
    sum_alpha_odd = np.sum(psds_odd['Alpha'])
    sum_alpha_even = np.sum(psds_even['Alpha'])
    sum_beta_odd = np.sum(psds_odd['Beta'])
    sum_beta_even = np.sum(psds_even['Beta'])

    # Compute Hemispheric Index
    hemispheric_index = {
        'Alpha': np.divide(sum_alpha_odd,sum_alpha_even),
        'Beta': np.divide(sum_beta_odd,sum_beta_even)
    }

    return relative_diff, hemispheric_index

def stroke_assessment(ratios, rbp, rd, hi):
    """
    Analyzes the computed metrics by running them through a set of thresholds to assess the risk of stroke.

    Parameters: 
    - DAR: delta/alpha ratio
    - DBR: delta/beta ratio
    - RBP_A: relative band power contributed by alpha
    - RBP_B: relative band power contributed by beta
    - RD_A: relative difference from alpha channels
    - RD_B: relative difference from beta channels
    - HR_A: hemispheric ratio from alpha channels
    - HR_B: hemispheric ratio from the beta channels

    Returns:

    """
    # Initialize empty dict to store flag per metric
    keys = ["Ratios", "RBP Beta", "RBP Alpha", "Relative Diff Alpha", "Relative Diff Beta", "Hemispheric Index Alpha", "Hemispheric Index Beta"]
    flags = dict.fromkeys(keys)
    flag_descriptions = []


    # Thresholds: Ratios
    if (ratios['DAR'] > 9 and ratios['DBR'] > 22):
        flags["Ratios"] = 1 # EEG Flag = 1
        ratio_desc = "Abnormal"
        flag_descriptions.append(ratio_desc)
    else:
        ratio_desc = "Normal"
        flag_descriptions.append(ratio_desc)
    
    # Thresholds: RBP
    if (rbp['Beta'] < 0.05):
        flags["RBP Beta"] = 1
        rbpb_desc = "Abnormal"
        flag_descriptions.append(rbpb_desc)
    else:
        rbpb_desc = "Normal"
        flag_descriptions.append(rbpb_desc)    
    if (rbp['Alpha'] < 0.1):
        flags["RBP Alpha"] = 1
        rbpa_desc = "Abnormal"
        flag_descriptions.append(rbpa_desc)
    else:
        rbpa_desc = "Normal"
        flag_descriptions.append(rbpa_desc)    
        
    
     # Thresholds: Asymmetric Indices
    if (rd['Alpha'] > 0.076):
        flags["Relative Diff Alpha"] = 1
        rda_desc = "Abnormal"
        flag_descriptions.append(rda_desc)
    else:
        rda_desc = "Normal"
        flag_descriptions.append(rda_desc)
    if (rd['Beta'] > 0.12):
        flags["Relative Diff Beta"] = 1
        rdb_desc = "Abnormal"
        flag_descriptions.append(rdb_desc)
    else:
        rdb_desc = "Normal"
        flag_descriptions.append(rdb_desc)
    
     # Thresholds: Hemispheric Index
    if (hi['Alpha'] < 1.05):
        flags["Hemispheric Index Alpha"] = 1
        hia_desc = 'Abnormal'
        flag_descriptions.append(hia_desc)
    else:
        hia_desc = 'Normal'
        flag_descriptions.append(hia_desc)
    if (hi['Beta'] < 1):
        flags["Hemispheric Index Beta"] = 1
        hib_desc = 'Abnormal'
        flag_descriptions.append(hib_desc)
    else:
        hib_desc = 'Normal'
        flag_descriptions.append(hib_desc)
    
    # Decision making
    output = 0
    for i in flags:
        if (flags[i] == 1):
            output += 1
    
    if output >= 4:
        result = 1
    else:
        result = 0
    
    return result, flag_descriptions