export * from "./hooks";
export * from "./components";

export {
  getMerchantProducts,
  getProductById,
  createProductAction,
  updateProductAction,
  deleteProductAction,
  toggleProductActiveAction,
  productSchema,
  type ProductInput,
} from "@/modules/catalog";

export { ProductForm } from "@/components/catalog/ProductForm";
export { ImageDropzone } from "@/components/catalog/ImageDropzone";
