import React, {useEffect, useState} from 'react';
import {Button, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {CameraView, CameraType, useCameraPermissions, BarcodeScanningResult} from 'expo-camera';
import {router} from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function GyroApp() {
    const [isDebouncing, setIsDebouncing] = useState(false);
    const [lastServerUrl, setLastServerUrl] = useState<string | null>(null);
    const [facing, setFacing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();

    useEffect(() => {
        (async () => {
            const storedUrl = await AsyncStorage.getItem('lastServerUrl');
            if (storedUrl) {
                setLastServerUrl(storedUrl);
            }
        })();
    }, []);

    const connectToLastServer = () => {
        if (lastServerUrl) {
            router.replace({pathname: '/mouse', params: {serverUrl: lastServerUrl}});
        } else {
            alert('No server URL found!');
        }
    };

    const onScanSuccess = async (e: BarcodeScanningResult) => {
        if (isDebouncing) return;

        setIsDebouncing(true);
        const serverUrl = e.data;

        await AsyncStorage.setItem('lastServerUrl', serverUrl);
        setLastServerUrl(serverUrl);

        router.replace({pathname: '/mouse', params: {serverUrl}});

        setTimeout(() => setIsDebouncing(false), 1000);
    };

    if (!permission) {
        return <View/>;
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={styles.message}>We need your permission to show the camera</Text>
                <Button onPress={requestPermission} title="grant permission"/>
            </View>
        );
    }

    function toggleCameraFacing() {
        setFacing(current => (current === 'back' ? 'front' : 'back'));
    }

    return (
        <View style={styles.container}>
            <CameraView style={styles.camera} facing={facing} onBarcodeScanned={onScanSuccess}>
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
                        <Text style={styles.text}>Flip Camera</Text>
                    </TouchableOpacity>
                </View>
            </CameraView>
            {lastServerUrl && (
                <View style={styles.lastServerContainer}>
                    <Button title="Connect to last used device" onPress={connectToLastServer}/>
                </View>
            )}
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
    },
    message: {
        textAlign: 'center',
        paddingBottom: 10,
    },
    camera: {
        flex: 1,
    },
    buttonContainer: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: 'transparent',
        margin: 64,
    },
    button: {
        flex: 1,
        alignSelf: 'flex-end',
        alignItems: 'center',
    },
    text: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    lastServerContainer: {
        padding: 20,
        alignItems: 'center',
    }
});