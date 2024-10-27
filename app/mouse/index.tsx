import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Animated } from 'react-native';
import { Gyroscope } from 'expo-sensors';
import { Subscription } from 'expo-modules-core';
import dgram from 'react-native-udp';
import { useLocalSearchParams } from "expo-router";
import {Buffer} from "buffer";

export default function Mouse() {
    const { serverUrl } = useLocalSearchParams();
    const [{ x, y, z }, setData] = useState({ x: 0, y: 0, z: 0 });
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [permissionStatus, setPermissionStatus] = useState(null);
    const [gyroEnabled, setGyroEnabled] = useState(false);
    const socketRef = useRef(null);

    const permission = async () => {
        const response = await Gyroscope.getPermissionsAsync();
        setPermissionStatus(response);
        return response;
    };

    const _slow = () => Gyroscope.setUpdateInterval(50);
    const _fast = () => Gyroscope.setUpdateInterval(10);

    const _subscribe = async () => {
        const response = await permission();
        if (response.granted) {
            setSubscription(
                Gyroscope.addListener(gyroscopeData => {
                    setData(gyroscopeData);
                    sendGyroData(gyroscopeData);
                })
            );
        }
    };

    const _unsubscribe = () => {
        subscription && subscription.remove();
        setSubscription(null);
    };

    const sendGyroData = (gyroData) => {
        const [ip_addr, port] = serverUrl.split(':');
        if (socketRef.current) {
            const message = Buffer.from(JSON.stringify({ event: 'gyroData', data: gyroData }));
            socketRef.current.send(message, 0, message.length, Number(port), ip_addr, (err) => {
                if (err) {
                    console.error('GyroData send error:', err);
                }
            });
        }
    };

    useEffect(() => {
        const udpSocket = dgram.createSocket('udp4');

        udpSocket.on('error', (err) => {
            console.error('Socket error:', err);
            udpSocket.close();
        });

        socketRef.current = udpSocket;

        udpSocket.bind(() => {
            setGyroEnabled(true);
            console.log('UDP socket bound');
        });

        (async () => {
            await _subscribe();
        })();

        return () => {
            udpSocket.close();
            _unsubscribe();
        };
    }, [serverUrl]);

    return (
        <View style={styles.container}>
            <Text style={styles.text}>Gyroscope:</Text>
            <Text style={styles.text}>x: {x.toFixed(2)}</Text>
            <Text style={styles.text}>y: {y.toFixed(2)}</Text>
            <Text style={styles.text}>z: {z.toFixed(2)}</Text>
            <Text style={styles.text}>
                Gyro Status: {gyroEnabled ? 'Enabled' : 'Disabled'}
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
