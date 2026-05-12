export class SubmitPaymentDto {
    min_id: string;
    tx_data?: string;
    amount: number;
    chain_id: number;
    reward_symbol?: string;
}
