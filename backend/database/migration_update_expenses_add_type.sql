-- Add expense_type and product_id to expenses table
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS expense_type TEXT CHECK (expense_type IN ('Cash', 'Product')) DEFAULT 'Cash',
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE SET NULL;

-- Create index for product_id
CREATE INDEX IF NOT EXISTS idx_expenses_product_id ON public.expenses(product_id);

