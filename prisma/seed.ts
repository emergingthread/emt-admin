import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function ensureMenu(menu: { name: string; parentId?: number; route?: string; icon: string; displayOrder: number }) {
  const existing = await prisma.menu.findFirst({ where: { name: menu.name, parentId: menu.parentId ?? null } });
  if (existing) {
    return prisma.menu.update({ where: { id: existing.id }, data: { route: menu.route ?? null, icon: menu.icon, displayOrder: menu.displayOrder, isActive: true } });
  }
  return prisma.menu.create({ data: { ...menu, route: menu.route ?? null, isActive: true } });
}

async function main() {
  const alex = await prisma.user.upsert({
    where: { email: "admin@emt.local" },
    update: {},
    create: { email: "admin@emt.local", name: "Alex Morgan", role: "Administrator" },
  });

  await prisma.incident.createMany({
    data: [
      { title: "Unit 14 dispatched", district: "North District", status: "active", assignedToId: alex.id },
      { title: "Incident #2048 resolved", district: "Central District", status: "resolved", assignedToId: alex.id },
      { title: "Vehicle check completed", district: "South District", status: "resolved", assignedToId: alex.id },
    ],
    skipDuplicates: true,
  });

  const incidentStatus = await prisma.commonMasterType.upsert({
    where: { name: "Incident status" },
    update: {},
    create: { name: "Incident status" },
  });
  const district = await prisma.commonMasterType.upsert({
    where: { name: "District" },
    update: {},
    create: { name: "District" },
  });
  const gender = await prisma.commonMasterType.upsert({
    where: { name: "Gender" },
    update: {},
    create: { name: "Gender" },
  });

  await prisma.commonMaster.createMany({
    data: [
      { name: "Active", commonTypeId: incidentStatus.id, commonTypeName: incidentStatus.name },
      { name: "Resolved", commonTypeId: incidentStatus.id, commonTypeName: incidentStatus.name },
      { name: "North District", commonTypeId: district.id, commonTypeName: district.name },
      { name: "Central District", commonTypeId: district.id, commonTypeName: district.name },
      { name: "WOMEN", commonTypeId: gender.id, commonTypeName: gender.name },
      { name: "MEN", commonTypeId: gender.id, commonTypeName: gender.name },
      { name: "BOYS", commonTypeId: gender.id, commonTypeName: gender.name },
      { name: "GIRLS", commonTypeId: gender.id, commonTypeName: gender.name },
      { name: "BABY", commonTypeId: gender.id, commonTypeName: gender.name },
      { name: "UNISEX", commonTypeId: gender.id, commonTypeName: gender.name },
    ],
    skipDuplicates: true,
  });

  const menuGroups = [
    { name: "Catalog", icon: "Package", displayOrder: 2 },
    { name: "Sales", icon: "ShoppingCart", displayOrder: 3 },
    { name: "Inventory", icon: "Boxes", displayOrder: 4 },
    { name: "Reports", icon: "BarChart3", displayOrder: 5 },
    { name: "Configuration", icon: "Settings", displayOrder: 6 },
  ];
  const groups = new Map<string, number>();
  for (const group of menuGroups) {
    groups.set(group.name, (await ensureMenu(group)).id);
  }

  const menuItems = [
    { name: "Dashboard", route: "/dashboard", icon: "LayoutDashboard", displayOrder: 1 },
    { name: "Products", parent: "Catalog", route: "/products", icon: "ShoppingBag", displayOrder: 1 },
    { name: "Product Variants", parent: "Catalog", route: "/product-variants", icon: "Layers", displayOrder: 2 },
    { name: "Categories", parent: "Catalog", route: "/categories", icon: "Tags", displayOrder: 3 },
    { name: "Orders", parent: "Sales", route: "/orders", icon: "ClipboardList", displayOrder: 1 },
    { name: "Customers", parent: "Sales", route: "/customers", icon: "Users", displayOrder: 2 },
    { name: "Coupons & Offers", parent: "Sales", route: "/coupons-offers", icon: "TicketPercent", displayOrder: 3 },
    { name: "Stock Overview", parent: "Inventory", route: "/inventory/stock", icon: "PackageCheck", displayOrder: 1 },
    { name: "Low Stock", parent: "Inventory", route: "/inventory/low-stock", icon: "AlertTriangle", displayOrder: 2 },
    { name: "Out of Stock", parent: "Inventory", route: "/inventory/out-of-stock", icon: "PackageX", displayOrder: 3 },
    { name: "Stock Adjustment", parent: "Inventory", route: "/inventory/adjustment", icon: "ArrowLeftRight", displayOrder: 4 },
    { name: "Sales Report", parent: "Reports", route: "/reports/sales", icon: "ChartNoAxesCombined", displayOrder: 1 },
    { name: "Revenue Report", parent: "Reports", route: "/reports/revenue", icon: "IndianRupee", displayOrder: 2 },
    { name: "Order Report", parent: "Reports", route: "/reports/orders", icon: "ClipboardList", displayOrder: 3 },
    { name: "Product Performance", parent: "Reports", route: "/reports/product-performance", icon: "TrendingUp", displayOrder: 4 },
    { name: "Category-wise Sales", parent: "Reports", route: "/reports/category-sales", icon: "ChartPie", displayOrder: 5 },
    { name: "Customer Report", parent: "Reports", route: "/reports/customers", icon: "Users", displayOrder: 6 },
    { name: "Common Types", parent: "Configuration", route: "/configuration/common-types", icon: "ListTree", displayOrder: 1 },
    { name: "Common Masters", parent: "Configuration", route: "/configuration/common-masters", icon: "Database", displayOrder: 2 },
    { name: "Menu Management", parent: "Configuration", route: "/configuration/menus", icon: "Menu", displayOrder: 3 },
    { name: "Users", route: "/users", icon: "UserCog", displayOrder: 7 },
  ];
  for (const item of menuItems) {
    await ensureMenu({ name: item.name, parentId: item.parent ? groups.get(item.parent) : undefined, route: item.route, icon: item.icon, displayOrder: item.displayOrder });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });