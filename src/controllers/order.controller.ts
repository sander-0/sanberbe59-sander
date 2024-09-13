import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import OrderModel from '../models/order.model';
import ProductModel from '../models/products.model'; 
import UserModel from '../models/user.model';
import { IRequestWithUser } from "../middlewares/auth.middleware";

// Fungsi untuk membuat order baru
async function createOrder(req: IRequestWithUser, res: Response) {
    /**
     #swagger.tags = ['Orders']
     #swagger.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: {
            $ref: "#/components/schemas/OrderRequest"
          }
        }
      }
     }
     #swagger.security = [{
       "bearerAuth": []
     }]
     */
    try {
      // Ambil data dari request body
      const { orderItems } = req.body;
      const userId = req.user?.id;
  
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }
  
      // Validasi dan kalkulasi grandTotal
      let grandTotal = 0;
  
      // Cek dan ambil detail produk
      for (const item of orderItems) {
        const product = await ProductModel.findById(item.productId);
        if (!product) {
          return res.status(404).json({ message: `Product not found: ${item.productId}` });
        }
        if (item.quantity > product.qty) {
          return res.status(400).json({ message: `Not enough stock for product: ${item.productId}` });
        }
        grandTotal += item.price * item.quantity;
  
        // Kurangi stok produk
        product.qty -= item.quantity;
        await product.save();
      }
  
      // Simpan order baru
      const newOrder = new OrderModel({
        grandTotal,
        orderItems,
        createdBy: userId,
        status: 'pending'
      });
      const savedOrder = await newOrder.save();
  
      // Ambil informasi pengguna
      const user = await UserModel.findById(userId);
      const userName = user ? user.fullName : 'Unknown';
  
      // Kembalikan respons
      res.status(201).json({
        message: 'Order created successfully',
        data: {
          ...savedOrder.toObject(),
          createdByName: userName,
        }
      });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({
        message: 'Failed to create order',
        data: err.message,
      });
    }
  }
  
  export { createOrder };

// Menampilkan Riwayat Order Berdasarkan Pengguna
export async function findAllByUser(req: IRequestWithUser, res: Response) {
    /**
     #swagger.tags = ['Orders']
     #swagger.security = [{
       "bearerAuth": []
     }]
     */   
    const userId = req.user?.id;  // Ambil ID user dari JWT payload

    try {
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
 
        // Ambil order berdasarkan userId
        const orders = await OrderModel.find({ createdBy: userId });
 
        if (orders.length === 0) {
            return res.status(404).json({
                message: 'No orders found for this user',
                data: []
            });
        }
 
        // Kembalikan hasil dengan status 200
        res.status(200).json({
            message: 'Orders retrieved successfully',
            data: orders
        });
    } catch (error) {
        const err = error as Error;
        res.status(500).json({
            data: err.message,
            message: 'Failed to retrieve orders',
        });
    }
}
 
