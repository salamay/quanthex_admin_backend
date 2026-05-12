export class SubmitUplinePaymentDto {
    sup_id: string; // The pending upline payment record to confirm
    tx_data?: string;
    chain_id: number;
}
