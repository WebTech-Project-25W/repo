import { User } from "./user";

export class customer extends User {
  status?: string;
  addr?: string;
  postcode?: string;
  phone?: string;
  deliveryZone?: string;

  isUpdating?: boolean;
}