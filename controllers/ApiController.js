const { initializeApp } = require('firebase/app');
const { getFirestore, getDocs, getDoc, addDoc, doc, collection, where, orderBy, query, setDoc, deleteDoc } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require("firebase/auth");
const admin = require('firebase-admin');
require('dotenv').config();

const firebaseConfig = {
    apiKey: process.env.FB_apiKey,
    authDomain: process.env.FB_authDomain,
    databaseURL: process.env.FB_databaseURL,
    projectId: process.env.FB_projectId,
    storageBucket: process.env.FB_storageBucket,
    messagingSenderId: process.env.FB_messagingSenderId,
    appId: process.env.FB_appId,
    measurementId: process.env.FB_measurementId
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// Firestore
exports.getCollection = async (req, res) => {
    try {
        const {
            collectionName,
            queries,
            orderByKeys,
            subCollections
        } = req.body;

        let data = [];
        let queriesList = [];
        let orderByList = [];

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
        console.error(error);
        res.status(400).send(error.code);
    }
}

exports.getObjectById = async (req, res) => {
    try {
        const {
            collectionName,
            docId
        } = req.body;

        let docRef = doc(db, collectionName, docId);
        let data;

        await getDoc(docRef).then((item) => {
            data = item.data ? { ...item.data(), id: item.id } : null;
        });

        res.status(200).json({ status: 'success', data });
    } catch (error) {
        console.error(error);
        res.status(400).send(error.code);
    }
}

exports.createObject = async (req, res) => {
    try {
        const {
            collectionName,
            objectData,
        } = req.body;

        let response;

        await addDoc(collection(db, collectionName), objectData).then((res) => {
            response = { status: 200, statusTitle: 'success', message: `Object was created with ID: ${res.id}`, data: { ...objectData, id: res.id } };
        }).catch((error) => {
            response = { status: 400, statusTitle: 'error', message: `Failed to create object. ${error.message}` };
        });

        res.status(response.status).json({ response });
    } catch (error) {
        console.error(error);
        res.status(400).send(error.code);
    }
}

exports.updateObject = async (req, res) => {
    try {
        const {
            collectionName,
            objectData,
        } = req.body;

        let response;
        const ref = doc(db, collectionName, objectData.id);
        let { ["id"]: id, ...values } = objectData;

        await setDoc(ref, values).then((res) => {
            response = { status: 200, statusTitle: 'success', message: `Object with ID: ${objectData.id} was updated`, data: { ...objectData, id: objectData.id } };
        }).catch((error) => {
            response = { status: 400, statusTitle: 'error', message: `Failed to update object. ${error.message}` }
        });

        res.status(response.status).json({ response });
    } catch (error) {
        console.error(error);
        res.status(400).send(error.code);
    }
}

exports.deleteObject = async (req, res) => {
    try {
        const {
            collectionName,
            objectData,
        } = req.body;

        let response;
        await deleteDoc(doc(db, collectionName, objectData.id)).then(() => {
            response = { status: 200, statusTitle: 'success', message: `Object with ID: ${objectData.id} was deleted`, data: { ...objectData, id: objectData.id } };
        }).catch((error) => {
            response = { status: 400, statusTitle: 'error', message: `Failed to delete object. ${error.message}` }
        });

        res.status(response.status).json({ response });

    } catch (error) {
        console.error(error);
        res.status(400).send(error.code);
    }
}

// Storage
// Authentication
exports.signIn = async (req, res) => {
    try {
        const {
            credentials
        } = req.body;

        let response;
        const auth = getAuth();
        await signInWithEmailAndPassword(auth, credentials.email, credentials.password).then( async (res) => {
            const user = res.user;
            const idToken = await user.getIdToken();

            response = { status: 200, statusTitle: 'success', user: user.uid, idToken };
        }).catch((error) => {
            response = { status: 400, statusTitle: 'error', message: `Failed to Sign-in. ${error.message}` }
        });
        res.status(response.status).json({ response });
    } catch (error) {
        console.error(error);
        res.status(400).send(error.code);
    }
}

exports.signUp = async (req, res) => {
    try {
        const {
            credentials
        } = req.body;

        let response;
        const auth = getAuth();
        await createUserWithEmailAndPassword(auth, credentials.email, credentials.password).then( async (res) => {
            const user = res.user;
            
        }).catch((error) => {

        });


    } catch(error) {

    }
}
// Mails