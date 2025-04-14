// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { 
    getFirestore, 
    doc, 
    getDoc, 
    updateDoc 
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import { 
    getAuth, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBOZcMMz-KmryhPkO0ith6ThUXmuv7Q4vk",
    authDomain: "awwal-7171e.firebaseapp.com",
    projectId: "awwal-7171e",
    storageBucket: "awwal-7171e.appspot.com",
    messagingSenderId: "920616341620",
    appId: "1:920616341620:web:adaf1c282f04a513d44121"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const profileImage = document.getElementById("profileImage");
const imageInput = document.getElementById("imageInput");
const fullNameInput = document.getElementById("fullName");
const bioInput = document.getElementById("bio");
const bioCharCount = document.getElementById("bioCharCount");
const emailElem = document.getElementById("email");
const loadingElem = document.getElementById("loading");
const updateBtn = document.getElementById("updateBtn");
const logoutBtn = document.getElementById("logoutBtn");

let userUID = null;

// Check authentication state and load profile
onAuthStateChanged(auth, async (user) => {
    if (user) {
        userUID = user.uid;
        try {
            loadingElem.textContent = "Loading profile...";
            loadingElem.classList.remove("hidden");
            
            const userDocRef = doc(db, "users", userUID);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                
                // Populate form fields
                fullNameInput.value = userData.fullName || "";
                emailElem.value = userData.email || user.email;
                bioInput.value = userData.bio || "";
                updateCharCount(bioInput.value.length);
                
                // Handle profile image
                if (userData.image) {
                    profileImage.src = userData.image;
                    // profileImage.classList.remove("hidden");
                } else if (user.photoURL) {
                    profileImage.src = user.photoURL;
                    // profileImage.classList.remove("hidden");
                }
                
                loadingElem.classList.add("hidden");
            } else {
                // Create basic profile if doesn't exist
                await updateDoc(userDocRef, {
                    name: user.fullName || "",
                    email: user.email || "",
                    bio: user.bio || "",
                    createdAt: new Date()
                });
                window.location.reload(); // Refresh to load new profile
            }
        } catch (error) {
            console.error("Error loading profile:", error);
            loadingElem.textContent = "Error loading profile. Please try again.";
        }
    } else {
        window.location.href = "signIn.html";
    }
});

// Handle image upload preview
imageInput.addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
        // Validate image file
        if (!file.type.match("image.*")) {
            alert("Please select an image file (JPEG, PNG, etc.)");
            return;
        }
        
        // Limit file size to 2MB
        if (file.size > 2 * 1024 * 1024) {
            alert("Image size should be less than 2MB");
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            profileImage.src = e.target.result;
            profileImage.classList.remove("hidden");
        };
        reader.readAsDataURL(file);
    }
});

bioInput.addEventListener("input", function() {
    const currentLength = this.value.length;
    updateCharCount(currentLength);
    
    // Enforce max length
    if (currentLength > 250) {
        this.value = this.value.substring(0, 250);
    }
});

function updateCharCount(length) {
    bioCharCount.textContent = length;
    
    if (length > 200) {
        bioCharCount.classList.add("warning");
    } else {
        bioCharCount.classList.remove("warning");
    }
}
// Update profile function
updateBtn.addEventListener("click", async () => {
    if (!userUID) return;

    const newName = fullNameInput.value.trim();
    const newBio = bioInput.value.trim();
    
    // Validate input
    if (!newName) {
        alert("Please enter your full name");
        fullNameInput.focus();
        return;
    }

    try {
        updateBtn.disabled = true;
        updateBtn.textContent = "Updating...";
        
        const userDocRef = doc(db, "users", userUID);
        const updatedData = {
            name: newName,
            bio: newBio,
            updatedAt: new Date()
        };

        // Handle image upload if selected
        if (imageInput.files.length > 0) {
            const file = imageInput.files[0];
            const reader = new FileReader();
            
            reader.onloadend = async function () {
                updatedData.image = reader.result;
                await updateDoc(userDocRef, updatedData);
                showSuccessMessage();
            };
            reader.readAsDataURL(file);
        } else {
            await updateDoc(userDocRef, updatedData);
            showSuccessMessage();
        }
    } catch (error) {
        console.error("Error updating profile:", error);
        alert("Failed to update profile. Please try again.");
        updateBtn.disabled = false;
        updateBtn.textContent = "Update Profile";
    }
});

// Show success message and reset button
function showSuccessMessage() {
    updateBtn.textContent = "Profile Updated!";
    updateBtn.style.backgroundColor = "#10b981";
    
    setTimeout(() => {
        updateBtn.textContent = "Update Profile";
        updateBtn.style.backgroundColor = "";
        updateBtn.disabled = false;
    }, 2000);
}

// Logout function
logoutBtn.addEventListener("click", async () => {
    try {
        logoutBtn.disabled = true;
        logoutBtn.textContent = "Logging out...";
        
        await signOut(auth);
        window.location.href = "signIn.html";
    } catch (error) {
        console.error("Error signing out:", error);
        alert("Failed to logout. Please try again.");
        logoutBtn.disabled = false;
        logoutBtn.textContent = "Logout";
    }
});