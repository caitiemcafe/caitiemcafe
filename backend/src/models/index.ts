import { DataTypes, Model, type InferAttributes, type InferCreationAttributes, type CreationOptional, type ForeignKey } from 'sequelize';
import { sequelize } from '../config/database.js';

export class Category extends Model<InferAttributes<Category>, InferCreationAttributes<Category>> {
  declare id: CreationOptional<number>; declare name: string; declare slug: string; declare imageUrl: string | null;
  declare sortOrder: CreationOptional<number>; declare isActive: CreationOptional<boolean>;
}
Category.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true }, name: { type: DataTypes.STRING(120), allowNull: false },
  slug: { type: DataTypes.STRING(140), allowNull: false, unique: true }, imageUrl: { type: DataTypes.STRING(500), allowNull: true },
  sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }, isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { sequelize, tableName: 'categories', modelName: 'Category' });

export class Product extends Model<InferAttributes<Product>, InferCreationAttributes<Product>> {
  declare id: CreationOptional<number>; declare categoryId: ForeignKey<Category['id']>; declare name: string; declare slug: string;
  declare description: string | null; declare price: string; declare imageUrl: string | null;
  declare isOutOfStock: CreationOptional<boolean>; declare isActive: CreationOptional<boolean>;
}
Product.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true }, categoryId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  name: { type: DataTypes.STRING(160), allowNull: false }, slug: { type: DataTypes.STRING(180), allowNull: false, unique: true },
  description: { type: DataTypes.TEXT, allowNull: true }, price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  imageUrl: { type: DataTypes.STRING(500), allowNull: true }, isOutOfStock: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { sequelize, tableName: 'products', modelName: 'Product' });

export class Order extends Model<InferAttributes<Order>, InferCreationAttributes<Order>> {
  declare id: CreationOptional<number>; declare orderCode: string; declare customerName: string; declare customerPhone: string;
  declare customerEmail: string | null; declare customerAddress: string; declare notes: string | null; declare shippingFee: string;
  declare totalAmount: string; declare paymentMethod: CreationOptional<string>; declare idempotencyKey: string | null;
  declare createdAt: CreationOptional<Date>; declare updatedAt: CreationOptional<Date>;
}
Order.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true }, orderCode: { type: DataTypes.STRING(32), allowNull: false, unique: true },
  customerName: { type: DataTypes.STRING(120), allowNull: false }, customerPhone: { type: DataTypes.STRING(20), allowNull: false },
  customerEmail: { type: DataTypes.STRING(254), allowNull: true }, customerAddress: { type: DataTypes.TEXT, allowNull: false },
  notes: { type: DataTypes.TEXT, allowNull: true }, shippingFee: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  totalAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false }, paymentMethod: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'COD' },
  idempotencyKey: { type: DataTypes.STRING(80), allowNull: true, unique: true }, createdAt: DataTypes.DATE, updatedAt: DataTypes.DATE,
}, { sequelize, tableName: 'orders', modelName: 'Order' });

export class OrderItem extends Model<InferAttributes<OrderItem>, InferCreationAttributes<OrderItem>> {
  declare id: CreationOptional<number>; declare orderId: ForeignKey<Order['id']>; declare productId: ForeignKey<Product['id']> | null;
  declare productName: string; declare quantity: number; declare unitPrice: string; declare subtotal: string; declare notes: string | null;
}
OrderItem.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true }, orderId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  productId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true }, productName: { type: DataTypes.STRING(160), allowNull: false },
  quantity: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false }, unitPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false }, notes: { type: DataTypes.TEXT, allowNull: true },
}, { sequelize, tableName: 'order_items', modelName: 'OrderItem' });

export class Quote extends Model<InferAttributes<Quote>, InferCreationAttributes<Quote>> {
  declare id: CreationOptional<number>; declare content: string; declare topic: string | null; declare scanCount: CreationOptional<number>;
  declare isActive: CreationOptional<boolean>; declare createdAt: CreationOptional<Date>; declare updatedAt: CreationOptional<Date>;
}
Quote.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true }, content: { type: DataTypes.TEXT, allowNull: false },
  topic: { type: DataTypes.STRING(100), allowNull: true }, scanCount: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }, createdAt: DataTypes.DATE, updatedAt: DataTypes.DATE,
}, { sequelize, tableName: 'quotes', modelName: 'Quote' });

export class Setting extends Model<InferAttributes<Setting>, InferCreationAttributes<Setting>> { declare key: string; declare value: string }
Setting.init({ key: { type: DataTypes.STRING(100), primaryKey: true }, value: { type: DataTypes.TEXT, allowNull: false } }, { sequelize, tableName: 'settings', modelName: 'Setting' });

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<number>; declare username: string; declare passwordHash: string; declare role: CreationOptional<string>;
}
User.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true }, username: { type: DataTypes.STRING(80), allowNull: false, unique: true },
  passwordHash: { type: DataTypes.STRING(255), allowNull: false }, role: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'admin' },
}, { sequelize, tableName: 'users', modelName: 'User' });

Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
Product.hasMany(OrderItem, { foreignKey: 'productId', as: 'orderItems' });
OrderItem.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
