// Import the functions you need from the SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    onAuthStateChanged,
    sendEmailVerification,
    signOut
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

// Your web app's Firebase configuration
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
const auth = getAuth(app);
const db = getFirestore(app);

// Get form and UI elements
const signInForm = document.getElementById("signInForm");
const email = document.getElementById("email");
const password = document.getElementById("password");
const rememberMe = document.getElementById("rememberMe");
const spinner = document.getElementById("spinner");
const submitBTN = document.getElementById("submitBTN");
const errorP = document.getElementById("errorP");

// Login event listener
signInForm.addEventListener("submit", logInUser);

async function logInUser(e) {
    e.preventDefault();
    spinner.classList.remove("d-none");
    submitBTN.disabled = true;
    errorP.textContent = "";

    const userDetails = {
        email: email.value.trim(),
        password: password.value.trim(),
        rememberMe: rememberMe.checked,
    };

    try {
        // Sign in user
        const res = await signInWithEmailAndPassword(auth, userDetails.email, userDetails.password);
        const user = res.user;
        const uid = user.uid;

        // Check if email is verified
        if (!user.emailVerified) {
            // Send verification email again
            await sendEmailVerification(user);
            
            // Sign out the user since email isn't verified
            await auth.signOut();
            
            throw new Error("Email not verified. We've sent a new verification email. Please check your inbox.");
        }

        // Get user's Firestore profile
        const docSnap = await getDoc(doc(db, "users", uid));
        
        if (docSnap.exists()) {
            const userData = docSnap.data();
            
            // Choose storage based on rememberMe
            const storage = userDetails.rememberMe ? localStorage : sessionStorage;
            
            // Store user data
            storage.setItem("userProfile", JSON.stringify({
                name: userData.fullName || userData.name || "",
                email: user.email,
                image: userData.image || "",
                uid: user.uid,
                role: userData.role || "user" // Default role if not specified
            }));

            // Verify data was stored
            const storedData = storage.getItem("userProfile");
            if (!storedData) {
                console.error("Failed to store user data");
                throw new Error("Failed to save user session");
            }
        } else {
            throw new Error("User profile not found");
        }

        // Redirect to home page
        window.location.href = '../index.html';
        
    } catch (error) {
        console.error("Login error:", error);
        
        // Custom error messages
        if (error.code === "auth/invalid-credential") {
            errorP.textContent = "Invalid email or password";
        } 
        else if (error.code === "auth/network-request-failed") {
            errorP.textContent = "Network error. Please check your internet connection";
        }
        else if (error.message.includes("Email not verified")) {
            errorP.textContent = error.message;
            Swal.fire({
                title: 'Email Verification Required',
                html: `We've sent a new verification email to <strong>${userDetails.email}</strong>. 
                       Please verify your email before signing in.`,
                icon: 'warning',
                confirmButtonColor: '#2EC4B6'
            });
        }
        else {
            errorP.textContent = error.message || "Login failed. Please try again.";
        }
    } finally {
        spinner.classList.add("d-none");
        submitBTN.disabled = false;
    }
}

// Check for existing session on page load
document.addEventListener('DOMContentLoaded', () => {
    const storedUser = localStorage.getItem("userProfile") || sessionStorage.getItem("userProfile");
    if (storedUser) {
        try {
            const user = JSON.parse(storedUser);
            email.value = user.email || "";
            if (user.rememberMe) {
                rememberMe.checked = true;
            }
        } catch (e) {
            console.error("Error parsing stored user data:", e);
        }
    }
});

// Optional: Listen to auth changes
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User is signed in:", user);
        // You could redirect verified users here if you want
        // if (user.emailVerified) {
        //     window.location.href = "../index.html";
        // }
    } else {
        console.log("No one is signed in");
    }
});

// Password toggle visibility
document.getElementById('togglePassword')?.addEventListener('click', function() {
    const password = document.getElementById('password');
    const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
    password.setAttribute('type', type);
    this.classList.toggle('bi-eye');
    this.classList.toggle('bi-eye-slash');
});