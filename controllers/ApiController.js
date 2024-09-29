
const { db, bucket, admin } = require('../firebase');
const { getDocs, getDoc, addDoc, doc, collection, where, orderBy, query, setDoc, deleteDoc } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } = require("firebase/auth");
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const Joi = require('joi');

const handleError = (res, error) => {
    console.error(error);
    res.status(400).send(error.code);
};

// Validation Schemas
const getCollectionSchema = Joi.object({
    collectionName: Joi.string().required(),
    queries: Joi.array().items(Joi.object({
        key: Joi.string().required(),
        compression: Joi.string().valid('==', '!=', '>', '<', '>=', '<=').required(),
        value: Joi.any().required(),
    })).optional(),
    orderByKeys: Joi.array().items(Joi.object({
        key: Joi.string().required(),
        asc: Joi.boolean().optional(),
    })).optional(),
    subCollections: Joi.array().items(Joi.string()).optional(),
});

const getObjectByIdSchema = Joi.object({
    collectionName: Joi.string().required(),
    docId: Joi.string().required(),
});

const createObjectSchema = Joi.object({
    collectionName: Joi.string().required(),
    objectData: Joi.object().required(),
});

const updateObjectSchema = Joi.object({
    collectionName: Joi.string().required(),
    objectData: Joi.object().required(),
});

const deleteObjectSchema = Joi.object({
    collectionName: Joi.string().required(),
    objectData: Joi.object().required(),
});

const uploadFileSchema = Joi.object({
    folder: Joi.string().optional(),
});

const deleteFileSchema = Joi.object({
    fileUrl: Joi.string().uri().required(),
});

const signInSchema = Joi.object({
    credentials: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
    }).required(),
});

const signUpSchema = Joi.object({
    credentials: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
    }).required(),
});

const resetPasswordSchema = Joi.object({
    email: Joi.string().email().required(),
});

const updateUserSchema = Joi.object({
    credentials: Joi.object({
        uid: Joi.string().required(),
        user: Joi.object().required(),
    }).required(),
});


// Firestore
exports.getCollection = async (req, res) => {
    const { error } = getCollectionSchema.validate(req.body);
    if (error) return res.status(400).json({ status: 'error', message: error.details[0].message });

    try {
        const {
            collectionName,
            queries,
            orderByKeys,
            subCollections
        } = req.body;

        const data = [];
        const queriesList = [];
        const orderByList = [];

        if (queries?.length > 0) {
            queries.map((i) => {
                queriesList.push(
                    where(i.key, i.compression, i.value)
                );
            });
        }

        if (orderByKeys?.length > 0) {
            orderByKeys.map((i) => {
                orderByList.push(
                    orderBy(i.key, i.asc ? "asc" : "desc")
                );
            });
        }

        let ref = collection(db, collectionName);
        let builder = [ref, ...queriesList];

        if (orderByList.length > 0) {
            builder.push(...orderByList);
        }

        builder = query(...builder);

        const snapshot = await getDocs(builder);

        if (subCollections?.length > 0) {
            for (let doc of snapshot.docs) {
                let docData = { ...doc.data(), id: doc.id };

                for (let subCollectionName of subCollections) {
                    const subRef = collection(db, `${collectionName}/${doc.id}/${subCollectionName}`);
                    const subSnapshot = await getDocs(subRef);

                    docData[subCollectionName] = subSnapshot.docs.map((subDoc) => ({
                        ...subDoc.data(),
                        id: subDoc.id
                    }));
                }

                data.push(docData);
            }
        } else {
            snapshot.docs.forEach((doc) => {
                data.push({ ...doc.data(), id: doc.id });
            });
        }

        res.status(200).json({ status: 'success', data });
    } catch (error) {
        handleError(res, error);
    }
}

exports.getObjectById = async (req, res) => {
    const { error } = getObjectByIdSchema.validate(req.body);
    if (error) return res.status(400).json({ status: 'error', message: error.details[0].message });

    try {
        const { collectionName, docId } = req.body;
        const docRef = doc(db, collectionName, docId);
        const item = await getDoc(docRef);
        const data = item.data() ? { ...item.data(), id: item.id } : null;
        res.status(200).json({ status: 'success', data });
    } catch (error) {
        handleError(res, error);
    }
}

exports.createObject = async (req, res) => {
    const { error } = createObjectSchema.validate(req.body);
    if (error) return res.status(400).json({ status: 'error', message: error.details[0].message });

    try {
        const { collectionName, objectData } = req.body;
        const docRef = await addDoc(collection(db, collectionName), objectData);
        res.status(200).json({ status: 'success', message: `Object was created with ID: ${docRef.id}`, data: { ...objectData, id: docRef.id } });
    } catch (error) {
        handleError(res, error);
    }
}

exports.updateObject = async (req, res) => {
    const { error } = updateObjectSchema.validate(req.body);
    if (error) return res.status(400).json({ status: 'error', message: error.details[0].message });

    try {
        const { collectionName, objectData } = req.body;
        const ref = doc(db, collectionName, objectData.id);
        const { ["id"]: id, ...values } = objectData;
        await setDoc(ref, values);
        res.status(200).json({ status: 'success', message: `Object with ID: ${objectData.id} was updated`, data: { ...objectData, id: objectData.id } });
    } catch (error) {
        handleError(res, error);
    }
}

exports.deleteObject = async (req, res) => {
    const { error } = deleteObjectSchema.validate(req.body);
    if (error) return res.status(400).json({ status: 'error', message: error.details[0].message });

    try {
        const { collectionName, objectData } = req.body;
        await deleteDoc(doc(db, collectionName, objectData.id));
        res.status(200).json({ status: 'success', message: `Object with ID: ${objectData.id} was deleted`, data: { ...objectData, id: objectData.id } });
    } catch (error) {
        handleError(res, error);
    }
}

// Storage
exports.uploadFile = async (req, res) => {
    const { error } = uploadFileSchema.validate(req.body);
    if (error) return res.status(400).json({ status: 'error', message: error.details[0].message });

    try {
        const file = req.file;
        if (!file) return res.status(400).json({ status: 'error', message: 'No file uploaded' });

        const folder = req.body.folder || 'uploads';
        const tempFilePath = file.path;
        const destination = `${folder}/${uuidv4()}_${file.originalname}`;

        const fullPath = path.resolve(__dirname, '../', folder);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
        }

        const uploadResponse = await bucket.upload(tempFilePath, {
            destination,
            metadata: {
                metadata: {
                    firebaseStorageDownloadTokens: uuidv4(),
                },
            },
        });

        const uploadedFile = uploadResponse[0];
        const fileUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(uploadedFile.name)}?alt=media&token=${uploadedFile.metadata.metadata.firebaseStorageDownloadTokens}`;
        res.status(200).json({ status: 'success', message: 'File uploaded successfully', fileUrl });
    } catch (error) {
        handleError(res, error);
    }
};


exports.deleteFile = async (req, res) => {
    const { error } = deleteFileSchema.validate(req.body);
    if (error) return res.status(400).json({ status: 'error', message: error.details[0].message });

    try {
        const fileUrl = req.body.fileUrl;

        if (!fileUrl) {
            return res.status(400).json({ status: 'error', message: 'File URL is required' });
        }

        const fileName = decodeURIComponent(fileUrl.split('/o/')[1].split('?')[0]);

        await bucket.file(fileName).delete();
        res.status(200).json({ status: 'success', message: 'File deleted successfully' });
    } catch (error) {
        handleError(res, error);
    }
};

// Authentication
exports.signIn = async (req, res) => {
    const { error } = signInSchema.validate(req.body);
    if (error) return res.status(400).json({ status: 'error', message: error.details[0].message });

    try {
        const { credentials } = req.body;
        const auth = getAuth();
        const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
        const user = userCredential.user;
        const idToken = await user.getIdToken();

        const expiresIn = 60 * 60 * 24 * 5 * 1000;
        const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });

        res.status(200).json({ status: 'success', user: user.uid, sessionCookie });
    } catch (error) {
        handleError(res, error);
    }
}


exports.signUp = async (req, res) => {
    const { error } = signUpSchema.validate(req.body);
    if (error) return res.status(400).json({ status: 'error', message: error.details[0].message });

    try {
        const { credentials } = req.body;
        const auth = getAuth();
        const userCredential = await createUserWithEmailAndPassword(auth, credentials.email, credentials.password);
        const user = userCredential.user;
        const idToken = await user.getIdToken();

        const expiresIn = 60 * 60 * 24 * 5 * 1000;
        const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn });

        const userData = {
            uid: user.uid,
            email: user.email,
            role: 'user',
            status: 'active'
        };

        const createResponse = await exports.createObject({
            body: {
                collectionName: 'users',
                objectData: userData
            }
        }, {
            status: (statusCode) => ({
                json: (responseBody) => console.log(responseBody)
            })
        });

        if (createResponse.status === 'error') {
            return res.status(400).json({ status: 'error', message: `Failed to create user data. ${createResponse.message}` });
        }

        res.status(200).json({ status: 'success', user: user.uid, sessionCookie });
    } catch (error) {
        handleError(res, error);
    }
}


exports.signOut = async (req, res) => {
    try {
        const sessionCookie = req.cookies.session || '';

        if (!sessionCookie) {
            return res.status(401).json({ status: 'error', message: 'No active session' });
        }

        res.clearCookie('session');

        await admin.auth().verifySessionCookie(sessionCookie, true)
            .then(async (decodedClaims) => {
                await admin.auth().revokeRefreshTokens(decodedClaims.sub);
            })
            .catch((error) => {
                console.error("Error while verifying session cookie:", error);
                return res.status(401).json({ status: 'error', message: 'Invalid session' });
            });

        res.status(200).json({ status: 'success', message: 'Logged out successfully' });
    } catch (error) {
        handleError(res, error);
    }
}

exports.resetPassword = async (req, res) => {
    const { error } = resetPasswordSchema.validate(req.body);
    if (error) return res.status(400).json({ status: 'error', message: error.details[0].message });

    try {
        const { email } = req.body;
        const auth = getAuth();
        await sendPasswordResetEmail(auth, email);
        res.status(200).json({ status: 'success', message: 'Password reset email sent' });
    } catch (error) {
        handleError(res, error);
    }
}


exports.updateUser = async (req, res) => {
    const { error } = updateUserSchema.validate(req.body);
    if (error) return res.status(400).json({ status: 'error', message: error.details[0].message });

    try {
        const {
            credentials,
        } = req.body;

        await admin.auth().updateUser(credentials.uid, credentials.user);
        res.status(200).json({ status: 'success', message: `User ${credentials.uid} successful updated` });
    } catch (error) {
        handleError(res, error);
    }
}
// Mails