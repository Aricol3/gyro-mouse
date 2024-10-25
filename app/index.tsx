import React, {useState} from 'react';
import {Button, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {CameraView, CameraType, useCameraPermissions} from 'expo-camera';
import {io} from 'socket.io-client';
import {router} from "expo-router";

export default function GyroApp() {
    const [connected, setConnected] = useState(false);
    const [socket, setSocket] = useState(null);
    const [da, setDa] = useState(null);

    const [isDebouncing, setIsDebouncing] = useState(false);

    const onScanSuccess = (e) => {
        if (isDebouncing) return;

        setIsDebouncing(true);
        const serverUrl = e.data;
        setDa(serverUrl);

        router.replace({ pathname: '/mouse', params: { serverUrl } });

        setTimeout(() => setIsDebouncing(false), 1000);
    };

    const [facing, setFacing] = useState<CameraType>('back');
    const [permission, requestPermission] = useCameraPermissions();

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
            {!connected ? (
                <CameraView style={styles.camera} facing={facing} onBarcodeScanned={onScanSuccess}>
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
                            <Text style={styles.text}>Flip Camera</Text>
                        </TouchableOpacity>
                    </View>
                </CameraView>
            ) : (
                <Text>Connected to the server! {da}</Text>
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
});