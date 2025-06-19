-- إصلاح فوري لمشكلة المصفوفات في PostgreSQL
-- Fix for PostgreSQL array issue - Run this in Supabase SQL Editor

-- 1. حذف الجدول الحالي وإنشاء جدول جديد بأعمدة مصفوفة صحيحة
-- Drop current table and create new one with correct array columns
DROP TABLE IF EXISTS members CASCADE;

-- 2. إنشاء جدول الأعضاء مع أعمدة مصفوفة صحيحة
-- Create members table with correct array columns
CREATE TABLE members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    age INTEGER NOT NULL,
    height INTEGER NOT NULL,
    weight INTEGER NOT NULL,
    gender TEXT,
    courses TEXT[] DEFAULT ARRAY[]::TEXT[], -- Array صحيح
    diet_plans TEXT[] DEFAULT ARRAY[]::TEXT[], -- Array صحيح
    course_groups JSONB DEFAULT '[]'::JSONB,
    diet_plan_groups JSONB DEFAULT '[]'::JSONB,
    subscription_start TIMESTAMPTZ,
    subscription_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. التأكد من وجود الجداول الأخرى
-- Ensure other tables exist
CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS diet_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    buyer_name TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. منح الصلاحيات
-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;

-- 5. رسالة تأكيد
-- Confirmation
SELECT 'تم إصلاح مشكلة المصفوفات! الآن يمكن رفع البيانات بنجاح.' as message;
