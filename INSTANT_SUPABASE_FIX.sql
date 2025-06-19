-- نفذ هذا الكود في Supabase SQL Editor الآن لحل المشكلة فوراً
-- Execute this code in Supabase SQL Editor now to fix the issue instantly

-- حذف الجداول الموجودة (إذا كانت بها مشاكل)
-- Drop existing tables (if they have issues)
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS diet_plans CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS sales CASCADE;

-- إنشاء جدول الأعضاء الصحيح
-- Create correct members table
CREATE TABLE members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    age INTEGER NOT NULL,
    height INTEGER NOT NULL,
    weight INTEGER NOT NULL,
    gender TEXT,
    courses TEXT DEFAULT '[]',
    diet_plans TEXT DEFAULT '[]',
    course_groups JSONB DEFAULT '[]',
    diet_plan_groups JSONB DEFAULT '[]',
    subscription_start TIMESTAMPTZ,
    subscription_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إنشاء جدول الكورسات
-- Create courses table
CREATE TABLE courses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إنشاء جدول الخطط الغذائية
-- Create diet plans table
CREATE TABLE diet_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إنشاء جدول المنتجات
-- Create products table
CREATE TABLE products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إنشاء جدول المبيعات
-- Create sales table
CREATE TABLE sales (
    id TEXT PRIMARY KEY,
    buyer_name TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- منح جميع الصلاحيات
-- Grant all permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;

-- رسالة التأكيد
-- Confirmation message
SELECT 'تم إنشاء جميع الجداول بنجاح! يمكن الآن استخدام الإصلاح الطارئ في التطبيق.' as success_message;
