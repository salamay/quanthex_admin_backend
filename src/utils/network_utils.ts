export class NetworkUtils {
    public static rpcs: {[chainId: number]: string}={
        1:"https://go.getblock.io/e290a2fbe2574872924a89852fa341f0",
        56:"https://go.getblock.io/afb9702b784d4b2fa1b1b43290ecf787",
        137:"https://go.getblock.io/64929c98232f46928335f57b7faeeb07"
    }

    public static getRpc(chainId: number): string {
        return NetworkUtils.rpcs[chainId];
    }
}