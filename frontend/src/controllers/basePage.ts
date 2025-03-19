export class BasePage {
    constructor(public pageName: string) {}

    initialize(): void {
        console.log(`[${this.pageName} page initialized.]`)
    }
}