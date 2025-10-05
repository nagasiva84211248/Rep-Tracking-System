import { Image, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { StackScreenProps } from '@react-navigation/stack'
import { RootStackParamList } from '../../../App'

type SummaryScreenProps = StackScreenProps<
    RootStackParamList,
    'SummaryScreen'
>

const SummaryScreen: React.FC<SummaryScreenProps> = ({ route }) => {
    const { summaryData } = route.params;
    const [totalMinuts, setTotalMinutes] = useState<string>();
    const [totalDistance, setTotalDistance] = useState<number>();

    useEffect(() => {
        console.log("summaryData", summaryData)
        addCheckInOutTimeDistance();
    }, []);

    const addCheckInOutTimeDistance = () => {
        let totalSeconds = 0;
        let distance = 0;
        if (summaryData) {
            let [hIn, hmin, hsecin] = summaryData.startTime && summaryData.startTime.length > 0 ? summaryData.startTime.split(':').map(Number) : [0, 0, 0];
            let [hOut, hmout, hsecout] = summaryData.endTime && summaryData.endTime.length > 0 ? summaryData.endTime.split(':').map(Number) : [0, 0, 0];
            let findInSeconds = hIn * 3600 + hmin * 60 + hsecin
            let findOutSeconds = hOut * 3600 + hmout * 60 + hsecout
            let diff = Math.max(findOutSeconds - findInSeconds);
            totalSeconds += diff;
            distance += summaryData.distance;
        }
        setTotalMinutes((totalSeconds / 60).toFixed(2));
        setTotalDistance(distance);
    }

    console.log(summaryData)
    return (
        <View style={styles.container}>
            <View style={styles.subContainer}>
                <Image source={require('../../assets/images/journeyCompleted.png')} style={styles.imageStyle} />
                <View style={styles.statsContainer}>
                    <View style={styles.card}>
                        <Text style={styles.title}>Summary</Text>

                        <View style={styles.statRow}>
                            <View style={styles.statBox}>
                                <Text style={styles.label}>Total Distance</Text>
                                <Text style={styles.value}>{totalDistance} km</Text>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.statBox}>
                                <Text style={styles.label}>Total Time</Text>
                                <Text style={styles.value}>{totalMinuts} min</Text>
                            </View>
                        </View>
                    </View>
                </View>

            </View>
            <View style={styles.emptyContainer} />
        </View>
    )
}

export default SummaryScreen

const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
        backgroundColor: '#afd5efff',
        justifyContent: 'space-between',
        alignItems: 'center',
        flex: 1,
    },
    imageStyle: {
        height: 200,
        width: '100%',
        marginTop: 100,
    },
    subContainer: {
        borderBottomRightRadius: 250,
        borderBottomLeftRadius: 250,
        backgroundColor: '#fff',
        width: '100%',
        height: '75%'
    },
    emptyContainer: {
        height: '25%',
        backgroundColor: '#afd5efff',
        width: '100%'
    },
    statsContainer: {
        marginTop: 60,
        alignItems: 'center',
    },
    card: {
        width: '85%',
        backgroundColor: '#ffffff',
        borderRadius: 20,
        paddingVertical: 20,
        paddingHorizontal: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 5,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1a1a1a',
        textAlign: 'center',
        marginBottom: 15,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    label: {
        fontSize: 14,
        color: '#7a7a7a',
    },
    value: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#007AFF',
        marginTop: 4,
    },
    divider: {
        height: '100%',
        width: 1,
        backgroundColor: '#e0e0e0',
    },
})