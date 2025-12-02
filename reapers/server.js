const express = require('express');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const cors = require('cors');
const multer = require('multer');

const app = express();

// Platform-aware port configuration
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Create necessary directories
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create public/img directory if it doesn't exist
const imgDir = path.join(__dirname, 'public', 'img');
if (!fs.existsSync(imgDir)) {
    fs.mkdirSync(imgDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

// Email configuration - FIXED with Namecheap Private Email
const emailConfig = {
    host: 'mail.privateemail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'support@reapers.lol',
        pass: 'CAmron99(('
    },
    tls: {
        rejectUnauthorized: false
    }
};

let transporter;
try {
    transporter = nodemailer.createTransport(emailConfig);
    transporter.verify(function(error, success) {
        if (error) {
            console.log('❌ Email server connection failed:', error.message);
        } else {
            console.log('✅ Email server is ready');
        }
    });
} catch (error) {
    console.log('⚠️  Email configuration error:', error.message);
}

// In-memory storage
const users = new Map();
const verificationCodes = new Map();
const profiles = new Map();

// Admin credentials
const ADMIN_EMAIL = 'admin@reapers.lol';
const ADMIN_PASSWORD = 'admin';
const ADMIN_PAGE_PASSWORD = 'admin12345';

// Initialize with admin user
users.set('admin', {
    username: 'admin',
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    createdAt: new Date().toISOString(),
    isAdmin: true
});

profiles.set('admin', {
    username: 'admin',
    displayName: 'Admin',
    bio: 'Site Administrator',
    profilePic: '/public/img/default-avatar.png',
    banner: '/public/img/default-banner.jpg',
    background: '/public/img/default-bg.mp4',
    music: null,
    theme: 'dark',
    badges: ['staff', 'certif', 'dev'],
    socialLinks: {
        discord: 'https://discord.com/users/951831643491029012',
        github: 'https://github.com/admin',
        spotify: null,
        twitter: null,
        instagram: null,
        youtube: null,
        twitch: null,
        website: null,
        roblox: null
    },
    customizations: {
        cardTilt: true,
        cardTransparency: 0.8,
        cardBlur: 10,
        roundedCorners: true,
        nameEffect: 'glow',
        nameParticles: 'none',
        backgroundParticles: 'none',
        nameColor: '#ffffff',
        backgroundMusicVolume: 50
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewCount: 0
});

// Generate random 6-digit code
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function findUserByEmailAndPassword(email, password) {
    for (let [username, user] of users) {
        if (user.email === email && user.password === password) {
            return user;
        }
    }
    return null;
}

async function sendVerificationEmail(email, code, isLogin = false) {
    if (!transporter) {
        console.log('⚠️  Email transporter not configured');
        return false;
    }

    try {
        const mailOptions = {
            from: '"Reaper Bio Links" <support@reapers.lol>',
            to: email,
            subject: isLogin ? 'Your Login Verification Code' : 'Verify Your Reaper Bio Links Account',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; background: #0a0a0a; color: #fff; padding: 20px; }
                        .container { max-width: 600px; margin: 0 auto; background: rgba(20, 20, 20, 0.9); border-radius: 16px; padding: 40px; border: 1px solid rgba(255, 255, 255, 0.1); }
                        .code { font-size: 48px; font-weight: bold; letter-spacing: 10px; text-align: center; color: #fff; margin: 30px 0; background: rgba(255, 255, 255, 0.05); padding: 20px; border-radius: 12px; }
                        .footer { margin-top: 40px; font-size: 12px; color: rgba(255, 255, 255, 0.5); text-align: center; }
                        .logo { text-align: center; margin-bottom: 30px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="logo">
                            <h1>🔐 Reaper Bio Links</h1>
                        </div>
                        <h2>${isLogin ? 'Login Verification' : 'Account Verification'}</h2>
                        <p>${isLogin ? 'Here is your login verification code:' : 'Thank you for creating an account! Here is your verification code:'}</p>
                        <div class="code">${code}</div>
                        <p>Enter this code on the verification page to ${isLogin ? 'complete your login' : 'complete your registration'}.</p>
                        <p><strong>This code will expire in 10 minutes.</strong></p>
                        <div class="footer">
                            <p>If you didn't request this, please ignore this email.</p>
                            <p>© ${new Date().getFullYear()} Reaper Bio Links. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${email}: ${info.messageId}`);
        return true;
    } catch (error) {
        console.log('❌ Failed to send email:', error.message);
        return false;
    }
}

function initializeProfile(username, email) {
    console.log(`Initializing profile for ${username}`);
    
    const profile = {
        username: username,
        displayName: username,
        bio: `Welcome to my NM1 Bio Link!`,
        profilePic: '/public/img/default-avatar.png',
        banner: '/public/img/default-banner.jpg',
        background: '/public/img/default-bg.mp4',
        music: null,
        theme: 'dark',
        badges: [],
        socialLinks: {
            discord: null,
            github: null,
            spotify: null,
            twitter: null,
            instagram: null,
            youtube: null,
            twitch: null,
            website: null,
            roblox: null
        },
        customizations: {
            cardTilt: true,
            cardTransparency: 0.8,
            cardBlur: 10,
            roundedCorners: true,
            nameEffect: 'none',
            nameParticles: 'none',
            backgroundParticles: 'none',
            nameColor: '#ffffff',
            backgroundMusicVolume: 50
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        viewCount: 0
    };
    
    profiles.set(username, profile);
    console.log(`Profile created for ${username}, total profiles: ${profiles.size}`);
    return profile;
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/verify', (req, res) => {
    res.sendFile(path.join(__dirname, 'verify.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/:username', (req, res) => {
    const username = req.params.username.toLowerCase();
    
    if (username.includes('.html') || username.includes('.js') || username.includes('.css')) {
        const filePath = path.join(__dirname, username);
        if (fs.existsSync(filePath)) {
            return res.sendFile(filePath);
        }
        return res.status(404).send('Not found');
    }
    
    console.log(`Profile request for: ${username}, exists: ${profiles.has(username)}`);
    
    if (profiles.has(username)) {
        return res.sendFile(path.join(__dirname, 'profile.html'));
    } else {
        return res.status(404).send('Profile not found');
    }
});

// API Routes
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (username.length < 3) {
            return res.status(400).json({ error: 'Username must be at least 3 characters' });
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return res.status(400).json({ error: 'Username can only contain letters, numbers, and underscores' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        if (users.has(username.toLowerCase())) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        for (let [user, data] of users) {
            if (data.email === email) {
                return res.status(400).json({ error: 'Email already registered. Please login instead.' });
            }
        }

        const verificationCode = generateVerificationCode();
        verificationCodes.set(email, {
            code: verificationCode,
            username: username.toLowerCase(),
            password,
            email,
            createdAt: Date.now(),
            isLogin: false
        });

        console.log(`Registration initiated for ${username}, code: ${verificationCode}`);

        const emailSent = await sendVerificationEmail(email, verificationCode, false);
        
        if (!emailSent) {
            console.log(`⚠️  Email failed, using fallback: ${verificationCode}`);
            console.log(`Verification code for ${email}: ${verificationCode}`);
        }

        res.json({ 
            success: true, 
            message: emailSent ? 'Verification code sent to your email' : 'Verification code generated (email sending failed)',
            email: email,
            code: emailSent ? undefined : verificationCode
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Failed to register. Please try again.' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
            const adminUser = users.get('admin');
            const token = Buffer.from(`${ADMIN_EMAIL}:${Date.now()}:admin`).toString('base64');
            return res.json({ 
                success: true, 
                message: 'Admin login successful',
                token: token,
                username: 'admin',
                isAdmin: true,
                email: ADMIN_EMAIL
            });
        }

        const user = findUserByEmailAndPassword(email, password);
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password.' });
        }

        const verificationCode = generateVerificationCode();
        verificationCodes.set(email, {
            code: verificationCode,
            email,
            username: user.username,
            createdAt: Date.now(),
            isLogin: true
        });

        console.log(`Login verification for ${email}, code: ${verificationCode}`);

        const emailSent = await sendVerificationEmail(email, verificationCode, true);
        
        if (!emailSent) {
            console.log(`⚠️  Email failed, using fallback: ${verificationCode}`);
            console.log(`Login code for ${email}: ${verificationCode}`);
        }

        res.json({ 
            success: true, 
            message: emailSent ? 'Login code sent to your email' : 'Login code generated (email sending failed)',
            email: email,
            code: emailSent ? undefined : verificationCode
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Failed to send login code. Please try again.' });
    }
});

app.post('/api/verify', async (req, res) => {
    try {
        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({ error: 'Email and code are required' });
        }

        const verificationData = verificationCodes.get(email);
        if (!verificationData) {
            return res.status(400).json({ error: 'Invalid or expired code' });
        }

        const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
        if (verificationData.createdAt < tenMinutesAgo) {
            verificationCodes.delete(email);
            return res.status(400).json({ error: 'Code has expired. Please request a new one.' });
        }

        if (verificationData.code !== code) {
            return res.status(400).json({ error: 'Invalid verification code' });
        }

        verificationCodes.delete(email);

        const username = verificationData.username.toLowerCase();
        console.log(`Verification successful for ${username}, isLogin: ${verificationData.isLogin}`);

        if (!verificationData.isLogin) {
            console.log(`Creating user account for ${username}`);
            users.set(username, {
                username: username,
                email: verificationData.email,
                password: verificationData.password,
                createdAt: new Date().toISOString(),
                isAdmin: false
            });
            
            initializeProfile(username, verificationData.email);
            console.log(`Profile created for ${username}, redirecting to dashboard`);
        }

        const user = users.get(username);
        const token = Buffer.from(`${verificationData.email}:${Date.now()}:${user?.isAdmin ? 'admin' : 'user'}`).toString('base64');

        res.json({ 
            success: true, 
            message: verificationData.isLogin ? 'Login successful' : 'Registration successful',
            token: token,
            username: username,
            isAdmin: user?.isAdmin || false,
            email: verificationData.email
        });

    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ error: 'Verification failed. Please try again.' });
    }
});

app.post('/api/resend-code', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const verificationData = verificationCodes.get(email);
        if (!verificationData) {
            return res.status(400).json({ error: 'No pending verification for this email' });
        }

        const verificationCode = generateVerificationCode();
        
        verificationCodes.set(email, {
            ...verificationData,
            code: verificationCode,
            createdAt: Date.now()
        });

        console.log(`Resending code to ${email}, new code: ${verificationCode}`);

        const emailSent = await sendVerificationEmail(email, verificationCode, verificationData.isLogin);
        
        if (!emailSent) {
            console.log(`⚠️  Email failed, new code: ${verificationCode}`);
        }

        res.json({ 
            success: true, 
            message: emailSent ? 'New verification code sent' : 'New code generated (email sending failed)',
            email: email,
            code: emailSent ? undefined : verificationCode
        });

    } catch (error) {
        console.error('Resend code error:', error);
        res.status(500).json({ error: 'Failed to resend code. Please try again.' });
    }
});

app.get('/api/profile/:username', (req, res) => {
    const username = req.params.username.toLowerCase();
    const profile = profiles.get(username);
    
    console.log(`Profile API request for ${username}, found: ${!!profile}`);
    
    if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
    }

    profile.viewCount = (profile.viewCount || 0) + 1;
    
    res.json({ success: true, profile });
});

app.get('/api/my-profile', (req, res) => {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const decoded = Buffer.from(token, 'base64').toString();
        const [email, timestamp, role] = decoded.split(':');
        
        let username = null;
        for (let [user, data] of users) {
            if (data.email === email) {
                username = user;
                break;
            }
        }
        
        if (!username) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const profile = profiles.get(username);
        if (!profile) {
            return res.status(404).json({ error: 'Profile not found' });
        }
        
        res.json({ success: true, profile });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
});

app.put('/api/profile', upload.fields([
    { name: 'profilePic', maxCount: 1 },
    { name: 'banner', maxCount: 1 },
    { name: 'background', maxCount: 1 },
    { name: 'music', maxCount: 1 }
]), (req, res) => {
    try {
        const token = req.headers.authorization;
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const decoded = Buffer.from(token, 'base64').toString();
        const [email, timestamp, role] = decoded.split(':');
        
        let username = null;
        for (let [user, data] of users) {
            if (data.email === email) {
                username = user;
                break;
            }
        }
        
        if (!username) {
            return res.status(404).json({ error: 'User not found' });
        }

        const profileUpdates = {};
        
        if (req.body.updates) {
            try {
                Object.assign(profileUpdates, JSON.parse(req.body.updates));
            } catch (e) {
                console.log('Could not parse updates from req.body.updates, trying req.body directly');
            }
        }
        
        const bodyFields = ['displayName', 'bio', 'theme', 'badges', 'socialLinks', 'customizations'];
        bodyFields.forEach(field => {
            if (req.body[field]) {
                try {
                    if (typeof req.body[field] === 'string' && (field === 'socialLinks' || field === 'customizations' || field === 'badges')) {
                        profileUpdates[field] = JSON.parse(req.body[field]);
                    } else {
                        profileUpdates[field] = req.body[field];
                    }
                } catch (e) {
                    profileUpdates[field] = req.body[field];
                }
            }
        });
        
        if (!profiles.has(username)) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        const profile = profiles.get(username);
        
        if (req.files) {
            if (req.files.profilePic) {
                profile.profilePic = `/public/uploads/${req.files.profilePic[0].filename}`;
                console.log(`Updated profilePic: ${profile.profilePic}`);
            }
            if (req.files.banner) {
                profile.banner = `/public/uploads/${req.files.banner[0].filename}`;
                console.log(`Updated banner: ${profile.banner}`);
            }
            if (req.files.background) {
                profile.background = `/public/uploads/${req.files.background[0].filename}`;
                console.log(`Updated background: ${profile.background}`);
            }
            if (req.files.music) {
                profile.music = `/public/uploads/${req.files.music[0].filename}`;
                console.log(`Updated music: ${profile.music}`);
            }
        }

        Object.assign(profile, profileUpdates);
        profile.updatedAt = new Date().toISOString();
        
        profiles.set(username, profile);
        console.log(`Profile updated for ${username}`);
        
        res.json({ 
            success: true, 
            message: 'Profile updated successfully', 
            profile: profile 
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile: ' + error.message });
    }
});

// Admin page verification (password only, no login needed)
app.post('/api/admin/verify-password', (req, res) => {
    const { password } = req.body;
    
    if (password === ADMIN_PAGE_PASSWORD) {
        const adminSession = Buffer.from(`admin_page:${Date.now()}:verified`).toString('base64');
        res.json({ 
            success: true, 
            message: 'Password verified',
            session: adminSession
        });
    } else {
        res.status(401).json({ error: 'Invalid password' });
    }
});

// Get all users for admin (password protected)
app.get('/api/admin/all-users', (req, res) => {
    const session = req.headers.authorization;
    
    if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
        const decoded = Buffer.from(session, 'base64').toString();
        const [type, timestamp, status] = decoded.split(':');
        
        if (type !== 'admin_page' || status !== 'verified') {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        const userList = Array.from(users.entries()).map(([username, user]) => ({
            username,
            email: user.email,
            createdAt: user.createdAt,
            isAdmin: user.isAdmin || false,
            profile: profiles.get(username) || null
        }));
        
        res.json({ success: true, users: userList });
    } catch (error) {
        res.status(401).json({ error: 'Invalid session' });
    }
});

// Update user badges (admin only)
app.post('/api/admin/update-badges', (req, res) => {
    const session = req.headers.authorization;
    
    if (!session) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
        const decoded = Buffer.from(session, 'base64').toString();
        const [type, timestamp, status] = decoded.split(':');
        
        if (type !== 'admin_page' || status !== 'verified') {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        
        const { username, badges } = req.body;
        
        if (!profiles.has(username)) {
            return res.status(404).json({ error: 'User not found' });
        }

        const profile = profiles.get(username);
        profile.badges = badges;
        profile.updatedAt = new Date().toISOString();
        
        profiles.set(username, profile);
        
        res.json({ success: true, message: 'Badges updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update badges' });
    }
});

app.post('/api/upload-media', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const token = req.headers.authorization;
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const fileUrl = `/public/uploads/${req.file.filename}`;
        console.log(`File uploaded: ${fileUrl}, size: ${req.file.size} bytes`);
        
        res.json({ 
            success: true, 
            message: 'File uploaded successfully',
            url: fileUrl,
            filename: req.file.filename
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload file: ' + error.message });
    }
});

app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    const filePath = path.join(__dirname, req.path);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        return res.sendFile(filePath);
    }
    
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'reaper-bio-links',
        users: users.size,
        profiles: profiles.size,
        port: PORT,
        emailConfigured: !!transporter
    });
});

app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════╗
║      Reaper Bio Links Server                      ║
╠═══════════════════════════════════════════════════╣
║                                                   ║
║   Server running on: http://localhost:${PORT}     ║
║   Total users: ${users.size}                     ║
║   Total profiles: ${profiles.size}               ║
║   Admin: admin@reapers.lol / admin              ║
║   Admin Page Password: admin12345                ║
║   Email configured: ${transporter ? '✅' : '❌'}   ║
║   File uploads: NO SIZE LIMIT                    ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
    `);
});