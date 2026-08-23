# 🖼️ How to Add Your Hotel Lobby Image

## ⚠️ IMPORTANT: You MUST add your image!

The landing page is configured to use YOUR specific hotel lobby image.

---

## 📥 Step-by-Step Instructions

### Step 1: Download Your Image from ChatGPT

1. In ChatGPT, **right-click on the hotel lobby image**
2. Select **"Save image as..."**
3. Save it with this exact name: **`hotel-lobby.jpg`**

### Step 2: Create the Images Folder

```powershell
# Run this in your terminal (in the project folder)
New-Item -ItemType Directory -Force -Path "public\images"
```

Or manually:
1. Go to your project folder: `ids-next-fortune-hotel-pms-trainer`
2. Open the `public` folder
3. Create a new folder called `images`

### Step 3: Copy Your Image

1. Copy the `hotel-lobby.jpg` file you downloaded
2. Paste it into: `public/images/`

**Final path should be**:
```
public/images/hotel-lobby.jpg
```

### Step 4: Run the Application

```powershell
npm run dev
```

Open: http://localhost:5173/

---

## ✅ Verification

Your image is working if you see:
- The hotel lobby background in the hero section
- Your specific image (not a generic one)
- The image loads without errors

---

## 🐛 Troubleshooting

### Image Not Showing?

**Check 1: File Location**
```
✅ Correct:   public/images/hotel-lobby.jpg
❌ Wrong:     public/hotel-lobby.jpg
❌ Wrong:     src/images/hotel-lobby.jpg
❌ Wrong:     images/hotel-lobby.jpg
```

**Check 2: File Name**
- Must be exactly: `hotel-lobby.jpg`
- Case sensitive on some systems
- No spaces in filename

**Check 3: File Format**
- Must be `.jpg` or `.jpeg`
- If you have `.png`, rename the file extension to `.jpg`

**Check 4: Restart Server**
```powershell
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

---

## 🔄 Alternative: Use a Different Image

If you want to use a different image:

1. Save your image as `hotel-lobby.jpg`
2. Place it in `public/images/`
3. The code will automatically use it

---

## 📸 Image Requirements

### Recommended:
- **Format**: JPG or PNG
- **Size**: 1920x1080 or larger
- **Quality**: High resolution
- **Subject**: Hotel lobby, reception, or hospitality interior
- **Lighting**: Well-lit, professional

### File Size:
- **Optimal**: 200-500 KB (compressed)
- **Maximum**: 2 MB
- Too large = slow loading

---

## 💡 Tips

### Compress Your Image (Optional)
If your image is very large (> 2MB):
1. Use online tools like TinyJPG.com or Compressor.io
2. Compress to 80-90% quality
3. Save the compressed version

### Check Browser Console
1. Open browser (F12)
2. Go to "Console" tab
3. Look for image loading errors
4. Check "Network" tab to see if image loads

---

## ✅ Success Checklist

- [ ] Image downloaded from ChatGPT
- [ ] Saved as `hotel-lobby.jpg`
- [ ] Placed in `public/images/` folder
- [ ] Correct file path: `public/images/hotel-lobby.jpg`
- [ ] Dev server running (`npm run dev`)
- [ ] Page refreshed (F5)
- [ ] Image visible in hero section

---

## 📁 Final Folder Structure

```
ids-next-fortune-hotel-pms-trainer/
├── public/
│   └── images/
│       └── hotel-lobby.jpg  ← YOUR IMAGE HERE
├── src/
│   └── pages/
│       └── LandingPage.jsx
└── package.json
```

---

## 🚀 After Adding the Image

Once your image is in place:

```powershell
npm run dev
```

Visit: http://localhost:5173/

You'll see YOUR hotel lobby image as the hero background! 🎉

---

## ⚠️ Current Status

**Image Path Configured**: ✅ `/images/hotel-lobby.jpg`

**Image File Added**: ⚠️ **YOU NEED TO ADD THIS**

**Ready When**: You copy your image to `public/images/hotel-lobby.jpg`

---

**Questions?** The code is ready - just add your image file!
