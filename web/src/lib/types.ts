export type ProductCategory = "device" | "filter" | "part";
export type HardnessLevel = "soft" | "medium" | "hard" | "very_hard";
export type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "installed" | "cancelled";

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: ProductCategory;
  price: number;
  stages?: number;
  capacityLpd?: number;
  summary: string;
  specs: Record<string, string>;
  badge?: string;
  accentNote?: string;
  stock: number;
  /** CSS/SVG tabanlı görsel için renk tonu; statik görsel dosyası kullanılmaz. */
  tone: "sky" | "deep" | "mint" | "slate" | "ink";
}

export interface CartLine {
  productId: string;
  slug: string;
  name: string;
  price: number;
  qty: number;
  tone: Product["tone"];
}

export interface Region {
  id: string;
  name: string;
  technicianCount: number;
  avgInstallHours: number;
  activeCustomers: number;
  /** Türkiye SVG görünümünde 0-100 yüzde koordinatı. */
  x: number;
  y: number;
}

export interface Review {
  id: string;
  authorName: string;
  city: string;
  rating: number;
  text: string;
  productName: string;
}

export interface HardnessRecord {
  il: string;
  ilce?: string;
  ppm: number;
}

export interface Address {
  id: string;
  title: string;
  il: string;
  ilce: string;
  line: string;
  phone: string;
  isDefault: boolean;
}

export interface Order {
  id: string;
  createdAt: string;
  status: OrderStatus;
  total: number;
  lines: CartLine[];
  address: Omit<Address, "id" | "isDefault">;
  paymentRef: string;
  email: string;
  subscription: boolean;
}

export interface SupportTicket {
  id: string;
  createdAt: string;
  issueType: "pressure" | "leak" | "taste" | "other";
  note: string;
  status: "open" | "assigned" | "resolved";
}

export interface Appointment {
  id: string;
  slotStart: string;
  technicianName: string;
  type: "install" | "filter_change" | "service";
  status: "booked" | "completed" | "cancelled";
}

export interface Slot {
  id: string;
  technicianId: string;
  technicianName: string;
  start: string;
  end: string;
  status: "free" | "held" | "booked";
  heldUntil?: string;
  heldBy?: string;
}

export interface SessionUser {
  id: string;
  email: string;
  fullName?: string;
}
