import asyncio
import asyncpg

async def run():
    conn = await asyncpg.connect('postgresql://postgres.lgwhvgngsdrvhfqbqwhl:istinye2021@aws-1-ap-south-1.pooler.supabase.com:6543/postgres')
    try:
        await conn.execute("CREATE POLICY \"Allow public uploads\" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'product-images');")
        print('Policy created')
    except Exception as e:
        print('Error:', e)
    finally:
        await conn.close()

asyncio.run(run())
