export interface Category { id: number; name: string; slug: string; imageUrl: string | null; sortOrder: number; isActive: boolean }
export interface Product { id: number; categoryId: number; name: string; slug: string; description: string | null; price: string | number; imageUrl: string | null; isOutOfStock: boolean; isActive: boolean; category?: Pick<Category, 'id' | 'name' | 'slug'> }
export interface CartItem { key: string; product: Product; quantity: number; notes: string }
export interface Order { id: number; orderCode: string; customerName: string; customerPhone: string; customerEmail: string | null; customerAddress: string; notes: string | null; shippingFee: string; totalAmount: string; paymentMethod: string; createdAt: string; items: OrderItem[] }
export interface OrderItem { id: number; productName: string; quantity: number; unitPrice: string; subtotal: string; notes: string | null }
export interface Quote { id: number; content: string; topic: string | null; scanCount?: number; isActive?: boolean; createdAt?: string }
export interface Settings { shipping_fee?: string; shop_name?: string; shop_phone?: string; shop_address?: string; shop_email?: string; is_accepting_orders?: string; ai_provider?: string; ai_api_key?: string; ai_proxy_url?: string; ai_model?: string }
export interface ApiResponse<T> { success: boolean; message?: string; data: T; meta?: { page: number; limit: number; total: number; pages: number } }
