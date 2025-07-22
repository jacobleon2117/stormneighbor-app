# 🎨 React Native StyleSheet Cheat Sheet

*Quick reference for styling React Native components*

---

## 📦 **Layout & Spacing**

### **Flexbox**
```javascript
container: {
  flex: 1,                    // Takes all available space
  flexDirection: 'row',       // 'row', 'column' (default)
  justifyContent: 'center',   // 'flex-start', 'center', 'flex-end', 'space-between', 'space-around'
  alignItems: 'center',       // 'flex-start', 'center', 'flex-end', 'stretch'
  alignSelf: 'center',        // Override parent's alignItems for this item
}
```

### **Padding (Space Inside)**
```javascript
element: {
  padding: 20,                // All sides
  paddingVertical: 16,        // Top and bottom
  paddingHorizontal: 24,      // Left and right  
  paddingTop: 10,             // Individual sides
  paddingBottom: 10,
  paddingLeft: 15,
  paddingRight: 15,
}
```

### **Margin (Space Outside)**
```javascript
element: {
  margin: 20,                 // All sides
  marginVertical: 16,         // Top and bottom
  marginHorizontal: 24,       // Left and right
  marginTop: 10,              // Individual sides
  marginBottom: 10,
  marginLeft: 15,
  marginRight: 15,
}
```

### **Gap (Space Between Children)**
```javascript
container: {
  gap: 16,                    // Space between all children
  rowGap: 10,                 // Space between rows
  columnGap: 20,              // Space between columns
}
```

---

## 📏 **Size & Dimensions**

### **Width & Height**
```javascript
element: {
  width: 200,                 // Fixed width in pixels
  height: 100,                // Fixed height in pixels
  width: '100%',              // Percentage width
  height: '50%',              // Percentage height
  minWidth: 150,              // Minimum width
  maxWidth: 300,              // Maximum width
  minHeight: 40,              // Minimum height
  maxHeight: 200,             // Maximum height
}
```

### **Aspect Ratio**
```javascript
image: {
  aspectRatio: 1,             // Square (1:1)
  aspectRatio: 16/9,          // Widescreen (16:9)
  aspectRatio: 3/4,           // Portrait (3:4)
}
```

---

## 🎨 **Colors & Backgrounds**

### **Background Colors**
```javascript
element: {
  backgroundColor: '#3B82F6', // Hex color
  backgroundColor: 'blue',    // Named color
  backgroundColor: 'rgba(59, 130, 246, 0.5)', // RGBA with transparency
  backgroundColor: 'transparent', // Transparent background
}
```

### **Gradients** *(Need external library like expo-linear-gradient)*
```javascript
// Import: import { LinearGradient } from 'expo-linear-gradient';
<LinearGradient
  colors={['#3B82F6', '#1D4ED8']}
  style={styles.gradient}
>
```

---

## ➖ **Borders**

### **Border Width & Color**
```javascript
element: {
  borderWidth: 1,             // All sides
  borderColor: '#E5E7EB',     // Border color
  borderTopWidth: 2,          // Individual sides
  borderBottomWidth: 1,
  borderLeftWidth: 1,
  borderRightWidth: 1,
  borderTopColor: '#FF0000',  // Individual colors
  borderBottomColor: '#00FF00',
}
```

### **Border Radius (Rounded Corners)**
```javascript
element: {
  borderRadius: 12,           // All corners
  borderTopLeftRadius: 8,     // Individual corners
  borderTopRightRadius: 8,
  borderBottomLeftRadius: 4,
  borderBottomRightRadius: 4,
}
```

### **Border Style**
```javascript
element: {
  borderStyle: 'solid',       // 'solid', 'dotted', 'dashed'
}
```

---

## 🔤 **Typography**

### **Text Styling**
```javascript
text: {
  fontSize: 16,               // Text size
  fontWeight: '600',          // '100', '200', '300', '400', '500', '600', '700', '800', '900'
  fontFamily: 'Inter',        // Font name
  color: '#1F2937',           // Text color
  textAlign: 'center',        // 'left', 'center', 'right', 'justify'
  lineHeight: 24,             // Space between lines
  letterSpacing: 0.5,         // Space between letters
}
```

### **Text Decorations**
```javascript
text: {
  textDecorationLine: 'underline',     // 'none', 'underline', 'line-through'
  textDecorationColor: '#3B82F6',      // Decoration color
  textTransform: 'uppercase',          // 'none', 'uppercase', 'lowercase', 'capitalize'
  fontStyle: 'italic',                 // 'normal', 'italic'
}
```

---

## 🌫️ **Shadows & Effects**

### **iOS Shadows**
```javascript
element: {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
}
```

### **Android Shadows**
```javascript
element: {
  elevation: 4,               // Android shadow (higher = more shadow)
}
```

### **Both Platforms**
```javascript
element: {
  // iOS
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  // Android  
  elevation: 4,
}
```

### **Opacity**
```javascript
element: {
  opacity: 0.8,               // 0 = invisible, 1 = fully visible
}
```

---

## 🎭 **Positioning**

### **Position Types**
```javascript
element: {
  position: 'relative',       // Default - normal document flow
  position: 'absolute',       // Positioned relative to nearest positioned parent
  // No 'fixed' or 'sticky' in React Native
}
```

### **Absolute Positioning**
```javascript
element: {
  position: 'absolute',
  top: 20,                    // Distance from top
  bottom: 10,                 // Distance from bottom
  left: 15,                   // Distance from left
  right: 15,                  // Distance from right
  zIndex: 10,                 // Layer order (higher = on top)
}
```

---

## 🖼️ **Images**

### **Image Styling**
```javascript
image: {
  width: 200,
  height: 200,
  borderRadius: 100,          // Makes circular if width = height
  resizeMode: 'cover',        // 'cover', 'contain', 'stretch', 'repeat', 'center'
}
```

---

## 🔘 **Buttons & Touchables**

### **Button Styling**
```javascript
button: {
  backgroundColor: '#3B82F6',
  paddingVertical: 12,
  paddingHorizontal: 24,
  borderRadius: 8,
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 44,              // Good for touch targets
}

buttonText: {
  color: '#FFFFFF',
  fontSize: 16,
  fontWeight: '600',
}

// Disabled state
buttonDisabled: {
  backgroundColor: '#9CA3AF',
  opacity: 0.6,
}
```

---

## 📱 **Common Patterns**

### **Card Style**
```javascript
card: {
  backgroundColor: '#FFFFFF',
  borderRadius: 12,
  padding: 16,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
  elevation: 3,
  marginVertical: 8,
}
```

### **Input Field**
```javascript
input: {
  backgroundColor: '#FFFFFF',
  borderWidth: 1,
  borderColor: '#E5E7EB',
  borderRadius: 8,
  paddingHorizontal: 16,
  paddingVertical: 12,
  fontSize: 16,
  color: '#1F2937',
}

inputFocused: {
  borderColor: '#3B82F6',
  borderWidth: 2,
}
```

### **List Item**
```javascript
listItem: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: 16,
  borderBottomWidth: 1,
  borderBottomColor: '#E5E7EB',
}

listItemContent: {
  flex: 1,
  marginLeft: 12,
}
```

---

## 🎯 **StormNeighbor Brand Colors**

```javascript
colors: {
  background: '#F8FAFF',      // Main background
  text: '#1F2937',           // Primary text
  accent: '#FBBF24',         // Yellow highlight
  primary: '#3B82F6',        // Blue buttons
  white: '#FFFFFF',          // Cards, inputs
  gray: '#9CA3AF',           // Placeholder text
  border: '#E5E7EB',         // Borders, dividers
}
```

---

## 💡 **Quick Tips**

### **Responsive Design**
- Use `flex` instead of fixed heights
- Use percentages for widths: `width: '80%'`
- Test on different screen sizes

### **Performance**
- Avoid deep nesting of Views
- Use `FlatList` for long lists
- Optimize images with proper sizes

### **Accessibility**
- Add `accessibilityLabel` to touchable elements
- Use sufficient color contrast
- Make touch targets at least 44px

### **Debugging**
- Add `borderWidth: 1, borderColor: 'red'` to see element boundaries
- Use React Native Debugger for layout inspection