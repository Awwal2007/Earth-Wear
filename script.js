// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, getDocs, getDoc, updateDoc, doc, onSnapshot, orderBy, limit } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBOZcMMz-KmryhPkO0ith6ThUXmuv7Q4vk",
    authDomain: "awwal-7171e.firebaseapp.com",
    projectId: "awwal-7171e",
    storageBucket: "awwal-7171e.firebasestorage.app",
    messagingSenderId: "920616341620",
    appId: "1:920616341620:web:adaf1c282f04a513d44121"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const colRef = collection(db, 'products');
const cartCollection = collection(db, "cart");
// DOM Elements
const products = document.getElementById("productsDisplay");
const userIconDiv = document.getElementById("userIcon");
const logoutButton = document.getElementById("logoutButton");

const eNone = document.getElementById("e-dnone");
const dNone = document.getElementById("signUpOverlay");
const profilePage = document.getElementById("profilePage");
const searchInput = document.getElementById('productSearch'); // Add this input to your HTML
const productsContainer = document.getElementById('productsDisplayContainer'); // Container where all products are displayed

// Display Products
async function displayProducts() {
    const loadingSpinner = document.getElementById("loadingSpinner");
    const products = document.getElementById("productsDisplay");
    const skeletonLoader = document.getElementById("skeletonLoader");
    
    try {
        // Show loading spinner
        loadingSpinner.style.display = 'block';
        products.style.display = 'none'; // Hide products while loading
        skeletonLoader.style.display = 'flex'; // Show skeleton
        
        const querySnap = await getDocs(colRef);
        products.innerHTML = ''; // Clear existing content

        querySnap.forEach((docSnap) => {
            const actualData = docSnap.data();
            const productId = docSnap.id;

            products.innerHTML += `
                <div class="product-card-wrapper">
                    <div class="card product-card h-100" id="product-${productId}" 
                         data-search="${actualData.name.toLowerCase()} ${actualData.category.toLowerCase()} ${actualData.description.toLowerCase()}">
                        <img src="${actualData.image}" class="card-img-top product-img" alt="${actualData.name}">
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title">
                                ${actualData.name.length > 20 ? actualData.name.slice(0, 20) + "..." : actualData.name}
                            </h5>
                            <h6 class="price mb-0">${actualData.price}$</h6>
                            <p class="card-text">
                                ${actualData.description.length > 35 ? actualData.description.slice(0, 35) + "..." : actualData.description}
                            </p>
                            <button class="btn btn-cart rounded-pill add-to-cart" data-id="${productId}">
                                <i class="bi bi-cart-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
    } catch (error) {
        console.error("Error fetching products:", error);
        // Optionally show an error message to users
        products.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="bi bi-exclamation-triangle-fill text-danger fs-1"></i>
                <h3 class="mt-3">Failed to load products</h3>
                <p>Please try again later</p>
                <button class="btn btn-primary" onclick="displayProducts()">Retry</button>
            </div>
        `;
    } finally {
        // Hide loading spinner and show products
        loadingSpinner.style.display = 'none';
        products.style.display = 'flex'; // Or whatever display value you use
        skeletonLoader.style.display = 'none';
    }
}

displayProducts();

// Add to cart logic with nested structure
document.addEventListener("click", async (e) => {
    const button = e.target.closest(".add-to-cart");
    if (!button) return;

    e.preventDefault();
    const productId = button.getAttribute("data-id");
    const user = auth.currentUser;

    if (!user) {
        showToast("Please log in to add items to cart.", true);
        return;
    }

    const userCartRef = collection(db, "users", user.uid, "cart");

    // Disable and show spinner
    const originalHTML = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Adding...`;

    try {
        const productRef = doc(db, "products", productId);
        const productSnap = await getDoc(productRef);
        const productData = productSnap.data();

        const q = query(userCartRef, where("productId", "==", productId));
        const querySnap = await getDocs(q);

        if (!querySnap.empty) {
            const cartDoc = querySnap.docs[0];
            const currentQty = cartDoc.data().quantity || 1;

            await updateDoc(doc(db, "users", user.uid, "cart", cartDoc.id), {
                quantity: currentQty + 1
            });

            showToast(`Increased ${productData.name} to ${currentQty + 1}`);
        } else {
            const cartItem = {
                productId: productId,
                name: productData.name,
                price: productData.price,
                image: productData.image,
                quantity: 1,
                addedAt: new Date()
            };

            await addDoc(userCartRef, cartItem);
            showToast(`${productData.name} added to cart!`);
        }
    } catch (error) {
        console.error("Add to cart failed:", error);
        showToast("Error adding to cart.", true);
    } finally {
        button.disabled = false;
        button.innerHTML = originalHTML;
    }
});





onAuthStateChanged(auth, async (firebaseUser) => {
    // if (!sessionStorage.getItem("userProfile") && !localStorage.getItem("userProfile")) {
    //     window.location.href = "./pages/signIn.html";
    // }
    
    

    let user = sessionStorage.getItem("userProfile") || localStorage.getItem("userProfile");
    user = user ? JSON.parse(user) : null;

    if (firebaseUser && !user) {
        // Fetch from Firestore if session is missing        
        try {
            const docRef = doc(db, "users", firebaseUser.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                user = {
                    name: data.fullName,
                    email: firebaseUser.email,
                    image: data.image || '',
                    uid: firebaseUser.uid
                };
                sessionStorage.setItem("userProfile", JSON.stringify(user));
            } else {
                console.warn("User profile not found in Firestore.");
                await signOut(auth);
                return;
            }
        } catch (err) {
            console.error("Failed to fetch user profile:", err);
            await signOut(auth);
            return;
        }
    }

    if (firebaseUser) {
        userIconDiv.style.display = "none";
        document.getElementById("userProfilePic").classList.remove("d-none");
        document.getElementById("userProfilePic").src = user.image;
        logoutButton.classList.remove("d-none");
        profilePage.classList.remove("d-none");
        dNone.style.display = "none";
        eNone.style.display = "none";
        updateCartBadge();
        listenToCartChanges();
        console.log("user is signed in..");
        
    } else {
        console.log("User not logged in.");
    }
});


// Logout
logoutButton.addEventListener("click", async () => {
    try {
        sessionStorage.removeItem("userProfile");
        localStorage.removeItem("userProfile");
        await signOut(auth);

        window.location.href = "./index.html";
    } catch (error) {
        console.error("Logout error:", error);
    }
});

// Function to display recent products
async function displayRecentProducts() {
    try {
      const container = document.getElementById('recentProductsContainer');
      
      const q = query(
        collection(db, 'products'),
        orderBy('createdAt', 'desc'),
        limit(4)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        container.innerHTML = '<div class="col-12 text-center"><p>No recent products found</p></div>';
        return;
      }
      
      let productsHTML = '';
      
      querySnapshot.forEach(doc => {
        const product = doc.data();
        productsHTML += `
          <div class="col-md-3 col-sm-6 mb-4">
            <div class="card product-card h-100">
              <img src="${product.image}" class="card-img-top product-img" alt="${product.name}">
              <div class="card-body">
                <h5 class="card-title">${product.name}</h5>
                <p class="card-text">$${product.price.toFixed(2)}</p>
                <a href="#product-${doc.id}" class="btn btn-primary go-to-product">
                  Go to Product
                </a>
              </div>
            </div>
          </div>`;
      });
      
      container.innerHTML = productsHTML;
      
      // Add smooth scrolling to products
      document.querySelectorAll('.go-to-product').forEach(link => {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          const targetId = this.getAttribute('href');
          const targetElement = document.querySelector(targetId);
          if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth' });
            // Add highlight effect
            targetElement.classList.add('highlight');
            setTimeout(() => {
              targetElement.classList.remove('highlight');
            }, 2000);
          }
        });
      });
      
    } catch (error) {
      console.error("Error loading recent products:", error);
      container.innerHTML = `
        <div class="col-12 text-center">
          <p class="text-danger">Error loading products. Please try again later.</p>
        </div>`;
    }
  }

// Call the function when page loads
 window.addEventListener('DOMContentLoaded', displayRecentProducts);

 // Add this to your index.html (in a <script type="module"> tag)

 async function displayMostOrderedProducts() {
    const container = document.getElementById('mostOrderedContainer');
    
    try {
      // Get all orders to count product popularity
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      const productCounts = {};
      
      ordersSnapshot.forEach(doc => {
        const productId = doc.data().productId;
        productCounts[productId] = (productCounts[productId] || 0) + 1;
      });

      // Get top 6 most ordered products
      const sortedProducts = Object.entries(productCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

      // Get product details
      let productsHTML = '';
      for (const [productId] of sortedProducts) {
        const productDoc = await getDoc(doc(db, 'products', productId));
        if (productDoc.exists()) {
          const product = productDoc.data();
          productsHTML += `
            <div class="col">
              <div class="card h-100">
                <img src="${product.image}" class="card-img-top" alt="${product.name}" style="height: 180px; object-fit: cover;">
                <div class="card-body">
                  <h5 class="card-title">${product.name}</h5>
                  <p class="text-success fw-bold mb-2">$${product.price.toFixed(2)}</p>
                  <div class="d-flex justify-content-between align-items-center">
                    <span class="badge bg-primary">
                      <i class="fas fa-shopping-cart me-1"></i> ${productCounts[productId]} orders
                    </span>
                    <a href="#product-${productId}" class="btn btn-sm btn-outline-primary">View</a>
                  </div>
                </div>
              </div>
            </div>`;
        }
      }

      container.innerHTML = productsHTML || `
        <div class="col-12 text-center py-4">
          <div class="alert alert-info">
            No popular products found yet
          </div>
        </div>`;

    } catch (error) {
      console.error("Error loading popular products:", error);
      container.innerHTML = `
        <div class="col-12 text-center py-4">
          <div class="alert alert-danger">
            Error loading popular products
          </div>
        </div>`;
    }
  }

  
  
  // Call when page loads
  window.addEventListener('DOMContentLoaded', displayMostOrderedProducts);
  
  // Improved version with debounce
  // function setupProductSearch() {
  //     const productCards = Array.from(document.querySelectorAll('.product-card'));
  //     let allProductsHTML = productsContainer.innerHTML; // Save original HTML
      
  //     // Debounce function to limit how often search executes
  //     function debounce(func, timeout = 300) {
  //       let timer;
  //       return (...args) => {
  //         clearTimeout(timer);
  //         timer = setTimeout(() => { func.apply(this, args); }, timeout);
  //       };
  //     }
      
  //     const performSearch = debounce(function(searchTerm) {
  //       if (searchTerm.length === 0) {
  //         productsContainer.innerHTML = allProductsHTML;
  //         return;
  //       }
        
  //       const filteredProducts = productCards.filter(card => {
  //         const cardData = card.dataset.search.toLowerCase(); // Use data-search attribute
  //         return cardData.includes(searchTerm);
  //       });
        
  //       if (filteredProducts.length === 0) {
  //         productsContainer.innerHTML = `
  //           <div class="col-12 text-center py-5">
  //             <div class="alert alert-warning">
  //               <i class="fas fa-search me-2"></i>
  //               No products found matching "${searchTerm}"
  //             </div>
  //             <button id="resetSearch" class="btn btn-primary mt-3">
  //               Show All Products
  //             </button>
  //           </div>`;
            
  //         document.getElementById('resetSearch')?.addEventListener('click', function() {
  //           searchInput.value = '';
  //           productsContainer.innerHTML = allProductsHTML;
  //           setupProductSearch(); // Reinitialize
  //         });
  //       } else {
  //         productsContainer.innerHTML = '';
  //         filteredProducts.forEach(card => {
  //           productsContainer.appendChild(card.cloneNode(true));
  //         });
  //       }
  //     });
      
  //     searchInput.addEventListener('input', function() {
  //       performSearch(this.value.toLowerCase().trim());
  //     });
  //   }
    // Call this function when page loads
    // window.addEventListener('DOMContentLoaded', function() {
    //   setupProductSearch();
    // });

//update Cart Bagde
async function updateCartBadge() {
    const badge = document.getElementById("cart-badge"); // ⬅️ move this up
    if (!auth.currentUser || !badge) return;

    badge.classList.remove("badge-bounce");
    void badge.offsetWidth;
    badge.classList.add("badge-bounce");

    try {
        const cartRef = collection(db, "users", auth.currentUser.uid, "cart");
        const snapshot = await getDocs(cartRef);
        let itemCount = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            itemCount += data.quantity || 1;
        });

        badge.textContent = itemCount;
        badge.style.display = itemCount > 0 ? "inline-block" : "none";
    } catch (error) {
        console.error("Failed to update cart badge:", error);
    }
}

//listen to chart bagde changes
function listenToCartChanges() {
    const badge = document.getElementById("cart-badge");
    if (!auth.currentUser || !badge) return;

    const cartRef = collection(db, "users", auth.currentUser.uid, "cart");

    onSnapshot(cartRef, (snapshot) => {
        let totalQuantity = 0;

        snapshot.forEach((doc) => {
            const item = doc.data();
            totalQuantity += item.quantity || 1;
        });

        badge.textContent = totalQuantity;
        badge.style.display = totalQuantity > 0 ? "inline-block" : "none";
    });
}


//show toast fuction
document.getElementById("showToast").addEventListener("click", showToast)
function showToast(message, isError = false) {
    const toastElement = document.getElementById('cartToast');
    const toastBody = document.getElementById('toastMessage');

    toastElement.classList.remove('bg-success', 'bg-danger');
    toastElement.classList.add(isError ? 'bg-danger' : 'bg-success');
    toastBody.textContent = message;

    const toast = new bootstrap.Toast(toastElement);
    toast.show();
}