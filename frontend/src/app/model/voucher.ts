export class Voucher {
  id!: number;
  code!: string;
  discount!: number;
  isActive!: boolean;

  isBeingEdited?: boolean;
  isSaving?: boolean;
}