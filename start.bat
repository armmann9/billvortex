@echo off
title BillVortex - Boutique Billing & Retail Suite
chcp 65001 >nul
cd /d "%~dp0billing-suite"

echo ========================================================================
echo   🌸  BillVortex — Boutique Billing ^& Retail POS Suite
echo ========================================================================
echo.
echo   [ KAISE CHALAYEIN - AASAAN TAREEKA ]:
echo   1. Bas is "start.bat" file par double click karein.
echo   2. Server automatically background me chalu ho jayega.
echo   3. 3 seconds me aapke browser me website khud-b-khud khul jayegi:
echo      👉 http://localhost:3000
echo.
echo   4. Agar browser apne aap na khule, toh Chrome ya Edge me ye kholein:
echo      http://localhost:3000
echo.
echo   5. Demo Login ID aur Password:
echo      Email:    demo@billvortex.com
echo      Password: demo123
echo      (Ya fir website par "One-Click Demo Sign In" button dabayein)
echo.
echo   6. Dhyan rahe: Jab tak billing ya kaam chal raha hai, is window ko
echo      band mat karein (aap ise minimize karke rakh sakte hain).
echo.
echo ========================================================================
echo   Server shuru ho raha hai, kripya 3 seconds rukhein...
echo ========================================================================
echo.

start "BillVortex Server" cmd /k "npm run dev:web"

timeout /t 3 /nobreak >nul

echo   🌸 Browser khul raha hai: http://localhost:3000 ...
start http://localhost:3000

echo.
echo ========================================================================
echo   🌸 BillVortex safalta-poorvak shuru ho gaya hai!
echo.
echo   Seedhe Pages Par Jaane Ke Links:
echo   • POS Bill Counter (Kapde bechein): http://localhost:3000/pos
echo   • Dukan Dashboard (Bikri hisab):    http://localhost:3000/dashboard
echo   • Stock aur Kapde (Garments list):  http://localhost:3000/inventory
echo   • Grahak Khata (Udhaar hisab):      http://localhost:3000/customers
echo   • Kapda Vyapari (Suppliers list):   http://localhost:3000/suppliers
echo   • GST aur Tax Hisab (Reports):      http://localhost:3000/reports
echo   • About BillVortex:                 http://localhost:3000/about
echo.
echo   Kaam poora hone ke baad aap is window ko band kar sakte hain.
echo ========================================================================
echo.
pause
