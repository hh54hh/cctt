#!/bin/bash

# سكربت النشر التلقائي لنظام حسام جم
# Automated Deployment Script for Hussam Gym System

set -e  # إيقاف السكربت عند حدوث خطأ

# الألوان للإخراج
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# دالة لطباعة رسائل ملونة
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_success() {
    print_message $GREEN "✅ $1"
}

print_warning() {
    print_message $YELLOW "⚠️  $1"
}

print_error() {
    print_message $RED "❌ $1"
}

print_info() {
    print_message $BLUE "ℹ️  $1"
}

# التحقق من متطلبات النشر
check_requirements() {
    print_info "التحقق من متطلبات النشر..."
    
    # التحقق من Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js غير مثبت"
        exit 1
    fi
    
    # التحقق من npm
    if ! command -v npm &> /dev/null; then
        print_error "npm غير مثبت"
        exit 1
    fi
    
    # التحقق من package.json
    if [ ! -f "package.json" ]; then
        print_error "ملف package.json غير موجود"
        exit 1
    fi
    
    print_success "جميع المتطلبات متوفرة"
}

# تثبيت التبعيات
install_dependencies() {
    print_info "تثبيت التبعيات..."
    
    if npm ci; then
        print_success "تم تثبيت التبعيات بنجاح"
    else
        print_error "فشل في تثبيت التبعيات"
        exit 1
    fi
}

# التحقق من النوع
type_check() {
    print_info "التحقق من أنواع TypeScript..."
    
    if npm run typecheck; then
        print_success "تم التحقق من الأنواع بنجاح"
    else
        print_error "فشل في التحقق من الأنواع"
        exit 1
    fi
}

# تشغيل الاختبارات
run_tests() {
    print_info "تشغيل الاختبارات..."
    
    if npm test; then
        print_success "نجحت جميع الاختبارات"
    else
        print_error "فشلت بعض الاختبارات"
        exit 1
    fi
}

# بناء المشروع
build_project() {
    print_info "بناء المشروع للإنتاج..."
    
    if npm run build; then
        print_success "تم بناء المشروع بنجاح"
    else
        print_error "فشل في بناء المشروع"
        exit 1
    fi
}

# التحقق من حجم الملفات
check_bundle_size() {
    print_info "التحقق من حجم الملفات..."
    
    if [ -d "dist" ]; then
        local size=$(du -sh dist | cut -f1)
        print_info "حجم المجلد المبني: $size"
        
        # التحقق من الملفات الكبيرة
        find dist -name "*.js" -size +1M -exec echo "تحذير: ملف كبير - {}" \;
        find dist -name "*.css" -size +100k -exec echo "تحذير: ملف CSS كبير - {}" \;
    else
        print_error "مجلد dist غير موجود"
        exit 1
    fi
}

# نسخ ملفات إضافية
copy_additional_files() {
    print_info "نسخ الملفات الإضافية..."
    
    # نسخ ملف robots.txt إذا لم يكن موجوداً
    if [ ! -f "dist/robots.txt" ]; then
        echo -e "User-agent: *\nAllow: /\n\nSitemap: https://yourdomain.com/sitemap.xml" > dist/robots.txt
        print_success "تم إنشاء ملف robots.txt"
    fi
    
    # نسخ سكربت النسخ الاحتياطي
    if [ -f "scripts/backup-restore.js" ]; then
        cp scripts/backup-restore.js dist/
        print_success "تم نسخ سكربت النسخ الاحتياطي"
    fi
    
    # نسخ سكربت التحليلات
    if [ -f "scripts/analytics.js" ]; then
        cp scripts/analytics.js dist/
        print_success "تم نسخ سكربت التحليلات"
    fi
}

# تحسين الملفات
optimize_files() {
    print_info "تحسين الملفات..."
    
    # ضغط ملفات HTML
    if command -v html-minifier &> /dev/null; then
        find dist -name "*.html" -exec html-minifier --collapse-whitespace --remove-comments --minify-css --minify-js {} -o {} \;
        print_success "تم ضغط ملفات HTML"
    fi
    
    # تحسين الصور إذا كان imagemin متوفراً
    if command -v imagemin &> /dev/null; then
        imagemin dist/**/*.{jpg,jpeg,png} --out-dir=dist/optimized/
        print_success "تم تحسين الصور"
    fi
}

# إنشاء Service Worker محدث
update_service_worker() {
    print_info "تحديث Service Worker..."
    
    local sw_file="dist/sw.js"
    local version="v$(date +%Y%m%d%H%M%S)"
    
    if [ -f "$sw_file" ]; then
        sed -i "s/hussam-gym-v[0-9]*/hussam-gym-$version/g" "$sw_file"
        print_success "تم تحديث إصدار Service Worker إلى $version"
    fi
}

# نشر على Vercel
deploy_vercel() {
    print_info "النشر على Vercel..."
    
    if command -v vercel &> /dev/null; then
        if vercel --prod; then
            print_success "تم النشر على Vercel بنجاح"
        else
            print_error "فشل النشر على Vercel"
            return 1
        fi
    else
        print_warning "Vercel CLI غير مثبت"
        return 1
    fi
}

# نشر على Netlify
deploy_netlify() {
    print_info "النشر على Netlify..."
    
    if command -v netlify &> /dev/null; then
        if netlify deploy --prod --dir=dist; then
            print_success "تم النشر على Netlify بنجاح"
        else
            print_error "فشل النشر على Netlify"
            return 1
        fi
    else
        print_warning "Netlify CLI غير مثبت"
        return 1
    fi
}

# نشر عبر FTP
deploy_ftp() {
    local ftp_server=$1
    local ftp_user=$2
    local ftp_path=$3
    
    print_info "النشر عبر FTP..."
    
    if command -v lftp &> /dev/null; then
        lftp -c "
        set ftp:ssl-allow no;
        open ftp://$ftp_user@$ftp_server;
        lcd dist;
        cd $ftp_path;
        mirror --reverse --delete --verbose .;
        quit
        "
        print_success "تم النشر عبر FTP بنجاح"
    else
        print_error "lftp غير مثبت"
        return 1
    fi
}

# إنشاء تقرير النشر
generate_deploy_report() {
    local deploy_time=$(date '+%Y-%m-%d %H:%M:%S')
    local git_hash=$(git rev-parse HEAD 2>/dev/null || echo "غير متوفر")
    local git_branch=$(git branch --show-current 2>/dev/null || echo "غير متوفر")
    
    cat > dist/deploy-info.json << EOF
{
  "deployTime": "$deploy_time",
  "gitHash": "$git_hash",
  "gitBranch": "$git_branch",
  "nodeVersion": "$(node --version)",
  "npmVersion": "$(npm --version)",
  "buildSize": "$(du -sh dist | cut -f1)"
}
EOF
    
    print_success "تم إنشاء تقرير النشر"
}

# دالة التنظيف
cleanup() {
    print_info "تنظيف الملفات المؤقتة..."
    
    # حذف ملفات node_modules المؤقتة إذا كانت موجودة
    if [ -d ".temp" ]; then
        rm -rf .temp
    fi
    
    # حذف ملفات التخزين المؤقت
    npm cache clean --force 2>/dev/null || true
    
    print_success "تم التنظيف بنجاح"
}

# دالة المساعدة
show_help() {
    echo "سكربت النشر لنظام حسام جم"
    echo ""
    echo "الاستخدام:"
    echo "  ./deploy.sh [OPTIONS]"
    echo ""
    echo "الخيارات:"
    echo "  --help, -h          عرض هذه المساعدة"
    echo "  --skip-tests        تخطي الاختبارات"
    echo "  --skip-typecheck    تخطي فحص الأنواع"
    echo "  --vercel           النشر على Vercel"
    echo "  --netlify          النشر على Netlify"
    echo "  --ftp HOST USER PATH النشر عبر FTP"
    echo "  --cleanup          تنظيف الملفات فقط"
    echo ""
    echo "أمثلة:"
    echo "  ./deploy.sh --vercel"
    echo "  ./deploy.sh --netlify --skip-tests"
    echo "  ./deploy.sh --ftp example.com user123 /public_html"
}

# الدالة الرئيسية
main() {
    local skip_tests=false
    local skip_typecheck=false
    local deploy_target=""
    local ftp_args=()
    
    # معالجة المعاملات
    while [[ $# -gt 0 ]]; do
        case $1 in
            --help|-h)
                show_help
                exit 0
                ;;
            --skip-tests)
                skip_tests=true
                shift
                ;;
            --skip-typecheck)
                skip_typecheck=true
                shift
                ;;
            --vercel)
                deploy_target="vercel"
                shift
                ;;
            --netlify)
                deploy_target="netlify"
                shift
                ;;
            --ftp)
                deploy_target="ftp"
                ftp_args=("$2" "$3" "$4")
                shift 4
                ;;
            --cleanup)
                cleanup
                exit 0
                ;;
            *)
                print_error "خيار غير معروف: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    print_info "بدء عملية النشر لنظام حسام جم..."
    
    # تنفيذ خطوات النشر
    check_requirements
    install_dependencies
    
    if [ "$skip_typecheck" = false ]; then
        type_check
    fi
    
    if [ "$skip_tests" = false ]; then
        run_tests
    fi
    
    build_project
    check_bundle_size
    copy_additional_files
    optimize_files
    update_service_worker
    generate_deploy_report
    
    # النشر حسب المنصة المختارة
    case $deploy_target in
        "vercel")
            deploy_vercel
            ;;
        "netlify")
            deploy_netlify
            ;;
        "ftp")
            if [ ${#ftp_args[@]} -eq 3 ]; then
                deploy_ftp "${ftp_args[0]}" "${ftp_args[1]}" "${ftp_args[2]}"
            else
                print_error "معاملات FTP غير كاملة"
                exit 1
            fi
            ;;
        "")
            print_info "البناء مكتمل. استخدم --vercel أو --netlify أو --ftp للنشر"
            ;;
    esac
    
    cleanup
    
    print_success "اكتملت عملية النشر بنجاح! 🎉"
    print_info "ملفات المشروع متوفرة في مجلد dist/"
}

# تشغيل السكربت
main "$@"
