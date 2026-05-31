import type { SupabaseClient } from '@supabase/supabase-js'
import { applyKelalShopWatermark } from '@/lib/utils/watermark-image'

/** Upload seller product images with KelalShop watermark baked in. */
export async function uploadWatermarkedProductImages(
  supabase: SupabaseClient,
  productId: string,
  files: File[]
): Promise<void> {
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const raw = await file.arrayBuffer()
    const { buffer, contentType, ext } = await applyKelalShopWatermark(
      raw,
      file.type || 'image/jpeg'
    )
    const fileName = `${productId}/${crypto.randomUUID()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(fileName, buffer, {
        contentType,
        upsert: true,
      })

    if (!uploadError) {
      const { data: publicUrl } = supabase.storage.from('products').getPublicUrl(fileName)

      await supabase.from('product_images').insert({
        product_id: productId,
        url: publicUrl.publicUrl,
        is_primary: i === 0,
        sort_order: i,
      } as never)
    }
  }
}
