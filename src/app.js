import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app=express();
const allowedOrigins = [
    'http://localhost:5173',
    'https://code-haven-backend-eta.vercel.app',
    'https://code-haven-frontend.vercel.app'
];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));


app.use(express.json({limit:'16kb'}));
app.use(express.urlencoded({extended:false}));
app.use(express.static("public"));
app.use(cookieParser());

//Import routes
import userRouter from './routes/user.routes.js'
import tweetRouter from './routes/tweet.routes.js'
import problemRouter from './routes/problem.routes.js'
import runcodeRouter from './routes/runcode.route.js'
import submissionRouter from './routes/submission.routes.js'

//Routes Declaration
app.use('/api/v1/users',userRouter);
app.use('/api/v1/tweet',tweetRouter);
app.use('/api/v1/problem',problemRouter);
app.use('/api/v1/runcode',runcodeRouter);
app.use('/api/v1/submissions',submissionRouter);

export {app}