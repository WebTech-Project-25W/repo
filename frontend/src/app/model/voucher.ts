export class Voucher {
  id!: number;
  code!: string;
  discount_percent!: number;
  is_active!: boolean;

  isBeingEdited?: boolean;
}