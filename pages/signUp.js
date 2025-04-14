// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword,
    sendEmailVerification
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
// Initialize Auth
const auth = getAuth(app);
// Initialize Firestore
const db = getFirestore(app);

// Get references to DOM elements
const signUpForm = document.getElementById("signUpForm");
const imageInput = document.getElementById("image");
const imagePreview = document.getElementById("imagePreview");
const spinner = document.getElementById("spinner");
const submitBTN = document.getElementById("submitBTN");
const errorP = document.getElementById("errorP");

// Image Preview Event Listener
imageInput.addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            imagePreview.src = e.target.result;
            imagePreview.classList.remove("d-none");
        };
        reader.readAsDataURL(file);
    }
});

// Create User Account Function with Email Verification
async function createUserAccount(e) {
    spinner.classList.remove("d-none");
    submitBTN.disabled = true;
    errorP.textContent = "";
    e.preventDefault();

    const file = imageInput.files[0];
    const reader = new FileReader();

    reader.onloadend = async function () {
        const userDetails = {
            fullName: signUpForm.fullName.value.trim(),
            email: signUpForm.email.value.trim(),
            password: signUpForm.password.value.trim(),
            confirmPassword: signUpForm.confirmPassword.value.trim(),
            image: reader.result,
            checkbox: signUpForm.terms.checked,
            emailVerified: false,
            createdAt: new Date().toISOString()
        };

        let emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

        // Validate email
        if (!emailRegex.test(userDetails.email)) {
            errorP.textContent = "*Invalid email address";
            spinner.classList.add("d-none");
            submitBTN.disabled = false;
            return;
        }

        // Validate password length
        if (userDetails.password.length < 6) {
            errorP.textContent = "*Password should be at least 6 characters";
            spinner.classList.add("d-none");
            submitBTN.disabled = false;
            return;
        }

        // Check if passwords match
        if (userDetails.password !== userDetails.confirmPassword) {
            errorP.textContent = "*Passwords do not match";
            spinner.classList.add("d-none");
            submitBTN.disabled = false;
            return;
        }

        try {
            const { password, confirmPassword, ...details } = userDetails;

            // Create a new user with Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, details.email, password);
            const user = userCredential.user;
            
            // Send email verification
            await sendEmailVerification(user);
            
            // Save user data to Firestore
            await setDoc(doc(db, "users", user.uid), details);

            // Show success message with verification info
            Swal.fire({
                title: 'Account Created!',
                html: `We've sent a verification email to <strong>${userDetails.email}</strong>. 
                       Please check your inbox and verify your email address.`,
                icon: 'success',
                confirmButtonColor: '#2EC4B6'
            }).then(() => {
                signUpForm.reset();
                imagePreview.classList.add("d-none");
                window.location.href = "./signIn.html";
            });
            
        } catch (error) {
            console.error("Signup error:", error);
            if (error.code === "auth/email-already-in-use") {
                errorP.textContent = "Email already exists";
            } else {
                errorP.textContent = error.message;
            }
        } finally {
            spinner.classList.add("d-none");
            submitBTN.disabled = false;
        }
    };

    // If file is provided, load it, else directly execute onloadend
    if (file) {
        reader.readAsDataURL(file);
    } else {
        reader.onloadend();
    }
};

// Add event listener to form submission
signUpForm.addEventListener("submit", createUserAccount);

// Password toggle visibility
document.getElementById('togglePassword').addEventListener('click', function() {
    const password = document.getElementById('password');
    const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
    password.setAttribute('type', type);
    this.classList.toggle('bi-eye');
    this.classList.toggle('bi-eye-slash');
});

document.getElementById('toggleConfirmPassword').addEventListener('click', function() {
    const password = document.getElementById('confirmPassword');
    const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
    password.setAttribute('type', type);
    this.classList.toggle('bi-eye');
    this.classList.toggle('bi-eye-slash');
});

// Image preview
document.getElementById('image').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const preview = document.getElementById('imagePreview');
            preview.src = event.target.result;
            preview.classList.remove('d-none');
        }
        reader.readAsDataURL(file);
    }
});