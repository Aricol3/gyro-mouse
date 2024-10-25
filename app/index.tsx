import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Animated } from 'react-native';
import { Gyroscope } from 'expo-sensors';
import { Subscription } from 'expo-modules-core';

export default function Index() {
    const [{ x, y, z }, setData] = useState({ x: 0, y: 0, z: 0 });
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [permissionStatus, setPermissionStatus] = useState(null);
    const [gyroEnabled, setGyroEnabled] = useState(null);
    const [pointerPosition, setPointerPosition] = useState({ top: 200, left: 200 });

    let permission = async () => {
        const response = await Gyroscope.getPermissionsAsync();
        const response2 = await Gyroscope.isAvailableAsync();
        setPermissionStatus(response);
        setGyroEnabled(response2);
        return response;
    };

    const _slow = () => Gyroscope.setUpdateInterval(1000);
    const _fast = () => Gyroscope.setUpdateInterval(16);

    const _subscribe = async () => {
        const response = await permission();
        if (response.granted) {
            setSubscription(
                Gyroscope.addListener(gyroscopeData => {
                    setData(gyroscopeData);
                    updatePointerPosition(gyroscopeData);
                })
            );
        }
    };

    const _unsubscribe = () => {
        subscription && subscription.remove();
        setSubscription(null);
    };

    // Update the pointer's position based on gyroscope data
    const updatePointerPosition = ({ x, z }) => {
        // Adjust these values to change the sensitivity of the pointer
        const sensitivity = 10;

        // Calculate the new position based on the previous position
        const newTop = pointerPosition.top - x * sensitivity; // Invert x for upward movement
        const newLeft = pointerPosition.left - z * sensitivity; // Invert z for leftward movement

        // Keep the pointer within screen bounds
        setPointerPosition(prevPosition => ({
            top: Math.min(Math.max(prevPosition.top - x * sensitivity, 0), 400), // Assuming max height is 400
            left: Math.min(Math.max(prevPosition.left - z * sensitivity, 0), 400), // Assuming max width is 400
        }));
    };



    useEffect(() => {
        (async () => {
            await _subscribe();
        })();

        return () => _unsubscribe();
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.text}>Gyroscope:</Text>
            <Text style={styles.text}>x: {x.toFixed(2)}</Text>
            <Text style={styles.text}>y: {y.toFixed(2)}</Text>
            <Text style={styles.text}>z: {z.toFixed(2)}</Text>
            <Text style={styles.text}>
                Iti trag muie
            </Text>
            <Text style={styles.text}>
                Gyro Status: {gyroEnabled ? JSON.stringify(gyroEnabled) : 'Loading...'}
            </Text>
            <Text style={styles.text}>
                Permission Status: {permissionStatus ? JSON.stringify(permissionStatus) : 'Loading...'}
            </Text>
            <View style={styles.buttonContainer}>
                <TouchableOpacity onPress={subscription ? _unsubscribe : _subscribe} style={styles.button}>
                    <Text>{subscription ? 'On' : 'Off'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={_slow} style={[styles.button, styles.middleButton]}>
                    <Text>Slow</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={_fast} style={styles.button}>
                    <Text>Fast</Text>
                </TouchableOpacity>
            </View>
            {/* Pointer */}
            <Animated.View style={[styles.pointer, { top: pointerPosition.top, left: pointerPosition.left }]} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 10,
    },
    text: {
        textAlign: 'center',
    },
    buttonContainer: {
        flexDirection: 'row',
        alignItems: 'stretch',
        marginTop: 15,
    },
    button: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#eee',
        padding: 10,
    },
    middleButton: {
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: '#ccc',
    },
    pointer: {
        position: 'absolute',
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'red',
    },
});

