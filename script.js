import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBPOp8NtMBP09rNtCGe5-wRre6Y_Zt5g0M",
    authDomain: "venkat-textiles.firebaseapp.com",
    projectId: "venkat-textiles",
    storageBucket: "venkat-textiles.firebasestorage.app",
    messagingSenderId: "636994469508",
    appId: "1:636994469508:web:3635e18d8ee64288be0cd1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let cart = [];
let fetchedProducts = {};
let currentOrderId = "";
let finalCartTotal = 0;

window.loadProducts = async function() {
    const grid = document.getElementById('products-grid');
    try {
        const q = query(collection(db, "items"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        let content = '';

        if (querySnapshot.empty) {
            grid.innerHTML = `<p class="text-gray-500 col-span-full text-center py-10 text-sm">ప్రస్తుతం ఎటువంటి ప్రొడక్ట్స్ అందుబాటులో లేవు.</p>`;
            return;
        }

        querySnapshot.forEach((docItem) => {
            const p = docItem.data();
            const docId = docItem.id;
            fetchedProducts[docId] = p;

            const priceNum = Number(p.price) || 0;
            const discountVal = Number(p.discount) || 30;
            const originalPrice = Math.round(priceNum / (1 - (discountVal / 100)));
            const stockQty = Number(p.stock) || 0;
            const isOut = (p.status === "Out of Stock" || stockQty <= 0);

            content += `
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col justify-between relative">
                    <div class="absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded z-10 shadow">
                        ${discountVal}% off
                    </div>
                    <img loading="lazy" class="h-36 w-full object-cover bg-gray-100 ${isOut ? 'grayscale opacity-60' : ''}" src="${p.image}" alt="${p.name}">
                    
                    <div class="p-2.5 flex flex-col flex-grow">
                        <h3 class="font-bold text-gray-900 text-xs mb-0.5 truncate">${p.name}</h3>
                        <p class="text-gray-500 text-[9px] mb-1 truncate">${p.description || 'Pure Wholesale Quality'}</p>
                        
                        <div class="flex justify-between items-center mb-1">
                            <span class="text-xs font-black text-rose-600">₹${priceNum}</span>
                            <span class="text-[9px] text-gray-400 line-through">₹${originalPrice}</span>
                        </div>

                        <div class="mb-1.5">
                            ${isOut ? 
                                `<span class="text-[9px] font-bold text-red-600 bg-red-50 px-1 py-0.5 rounded border border-red-200">❌ Out of Stock</span>` :
                                `<span class="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200">📦 Stock: ${stockQty} Left</span>`
                            }
                        </div>

                        <div class="mt-auto">
                            ${isOut ? 
                                `<button disabled class="w-full bg-gray-300 text-gray-500 py-1.5 rounded-lg font-bold text-[10px] cursor-not-allowed">అందుబాటులో లేదు</button>` :
                                `<button onclick="addToCart('${docId}')" class="w-full bg-rose-600 hover:bg-rose-700 text-white py-1.5 rounded-lg font-bold text-[10px] shadow transition flex justify-center items-center gap-1">🛒 Add to Cart</button>`
                            }
                        </div>
                    </div>
                </div>
            `;
        });
        grid.innerHTML = content;
    } catch (e) {
        grid.innerHTML = `<p class="text-red-500 col-span-full text-center text-sm">డేటా లోడ్ అవ్వలేదు: ${e.message}</p>`;
    }
}

window.addToCart = function(id) {
    const product = fetchedProducts[id];
    if(!product) return;

    const stockLimit = Number(product.stock) || 0;
    const existing = cart.find(item => item.id === id);
    const currentQtyInCart = existing ? existing.qty : 0;

    if (currentQtyInCart + 1 > stockLimit) {
        alert("క్షమించండి, సరుకు స్టాక్ పరిమితికి మించిపోయింది.");
        return;
    }

    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ id, name: product.name, price: product.price, image: product.image, qty: 1, stock: stockLimit });
    }
    updateCartUI();
    showToast("కార్ట్‌లోకి జోడించబడింది!");
}

window.updateQty = function(id, change) {
    const item = cart.find(i => i.id === id);
    if (item) {
        const newQty = item.qty + change;
        if (newQty > item.stock) {
            alert("స్టాక్ పరిమితి ముగిసింది!");
            return;
        }
        item.qty = newQty;
        if (item.qty <= 0) {
            cart = cart.filter(i => i.id !== id);
        }
    }
    updateCartUI();
}

function updateCartUI() {
    const countEl = document.getElementById('cart-count');
    const itemsEl = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    
    const totalItems = cart.reduce((sum, i) => sum + i.qty, 0);
    countEl.innerText = totalItems;

    if (cart.length === 0) {
        itemsEl.innerHTML = `<p class="text-gray-400 text-center py-6 text-xs">మీ కార్ట్ ఖాళీగా ఉంది</p>`;
        totalEl.innerText = "₹0";
        return;
    }

    let html = '';
    let subtotal = 0;

    cart.forEach(i => {
        subtotal += i.price * i.qty;
        html += `
            <div class="flex items-center justify-between gap-2 bg-gray-50 p-2 rounded-xl border border-gray-100">
                <img src="${i.image}" class="w-9 h-9 object-cover rounded-lg">
                <div class="flex-grow">
                    <h4 class="font-bold text-gray-800 text-xs truncate max-w-[110px]">${i.name}</h4>
                    <p class="text-rose-600 font-black text-xs">₹${i.price * i.qty}</p>
                </div>
                <div class="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-1.5 py-0.5">
                    <button onclick="updateQty('${i.id}', -1)" class="text-gray-500 font-bold px-1 text-xs">-</button>
                    <span class="text-xs font-bold">${i.qty}</span>
                    <button onclick="updateQty('${i.id}', 1)" class="text-rose-600 font-bold px-1 text-xs">+</button>
                </div>
            </div>
        `;
    });

    itemsEl.innerHTML = html;
    totalEl.innerText = `₹${subtotal}`;
}

window.toggleCart = function() {
    document.getElementById('cartModal').classList.toggle('hidden');
}

window.openCheckoutModal = function() {
    if(cart.length === 0) {
        alert("ముందుగా మీ కార్ట్‌కి ప్రొడక్ట్స్ జోడించండి!");
        return;
    }
    currentOrderId = "VT-" + Math.floor(10000 + Math.random() * 90000);
    document.getElementById('displayOrderId').innerText = currentOrderId;

    toggleCart();
    document.getElementById('checkoutModal').classList.remove('hidden');
}

window.closeCheckoutModal = function() {
    document.getElementById('checkoutModal').classList.add('hidden');
}

window.proceedToPaymentQR = function() {
    const name = document.getElementById('custName').value;
    const phone = document.getElementById('custPhone').value;
    const address = document.getElementById('custAddress').value;
    const pincode = document.getElementById('custPincode').value;

    if(!name || phone.length !== 10 || !address || pincode.length !== 6) {
        alert("దయచేసి పేరు, 10 అంకెల ఫోన్ నంబర్, సరైన అడ్రస్ మరియు 6 అంకెల పిన్‌కోడ్ పూర్తిగా నింపండి.");
        return;
    }

    finalCartTotal = cart.reduce((sum, i) => sum + (i.price * i.qty), 0);
    document.getElementById('qrAmountText').innerText = `₹${finalCartTotal}`;

    const upiData = `upi://pay?pa=8121911438@okbizaxis&pn=VenkatTextiles&am=${finalCartTotal}&cu=INR`;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(upiData)}`;
    document.getElementById('dynamicQrImage').src = qrApiUrl;

    document.getElementById('checkoutModal').classList.add('hidden');
    document.getElementById('qrModal').classList.remove('hidden');
}

window.closeQRModal = function() {
    document.getElementById('qrModal').classList.add('hidden');
}

window.finishOrderWhatsApp = async function() {
    const utrNumber = document.getElementById('utrNumber').value.trim();
    if(!utrNumber || utrNumber.length < 6) {
        alert("దయచేసి పేమెంట్ పూర్తి చేసిన తర్వాత మీ 12 అంకెల UTR / Transaction ID ని ఎంటర్ చేయండి!");
        return;
    }

    const name = document.getElementById('custName').value;
    const phone = document.getElementById('custPhone').value;
    const address = document.getElementById('custAddress').value;
    const pincode = document.getElementById('custPincode').value;

    try {
        for (const item of cart) {
            const productData = fetchedProducts[item.id];
            const currentStock = Number(productData.stock) || 0;
            const updatedStock = Math.max(0, currentStock - item.qty);
            const newStatus = updatedStock === 0 ? "Out of Stock" : (productData.status || "In Stock");

            await updateDoc(doc(db, "items", item.id), {
                stock: updatedStock,
                status: newStatus
            });
        }
    } catch (err) {
        console.error("Stock update error: ", err);
    }

    let orderSummary = `🚀 *New Paid Order with UTR Proof (Venkat Textiles)*\n`;
    orderSummary += `🆔 Order ID: *${currentOrderId}*\n`;
    orderSummary += `💳 UTR / Transaction ID: *${utrNumber}*\n\n`;
    orderSummary += `👤 పేరు: *${name}*\n`;
    orderSummary += `📞 ఫోన్: *${phone}*\n`;
    orderSummary += `🏠 అడ్రస్: *${address}*\n`;
    orderSummary += `📮 పిన్‌కోడ్: *${pincode}*\n\n`;
    orderSummary += `🛒 ప్రొడక్ట్స్:\n`;
    
    let total = 0;
    cart.forEach(i => {
        orderSummary += `- ${i.name} (${i.qty} pcs) : ₹${i.price * i.qty}\n`;
        total += i.price * i.qty;
    });

    orderSummary += `\n💰 మొత్తం బిల్లు (Total): *₹${total}*`;
    orderSummary += `\n✅ పేమెంట్ వెరిఫై చేయబడింది (Merchant UPI: 8121911438@okbizaxis).`;

    const myNumber = "919441447923";
    window.open(`https://wa.me/${myNumber}?text=${encodeURIComponent(orderSummary)}`, '_blank');
}

function showToast(msg) {
    const t = document.getElementById('toast');
    t.innerText = msg;
    t.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => {
        t.classList.add('translate-y-20', 'opacity-0');
    }, 2000);
}

window.onload = loadProducts;
      
