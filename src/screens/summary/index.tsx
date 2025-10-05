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
                <View style={styles.textContainer}>
                    <Text style={styles.textStyle}>Total Distance: {totalDistance}</Text>
                    <Text style={styles.textStyle}>Total Minutes: {totalMinuts}</Text>
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
    textStyle: {
        fontSize: 25,
        fontWeight: 700,
        color: '#000'
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
    textContainer: {
        marginTop: 100,
        justifyContent: 'center',
        alignItems: 'center'
    },
    emptyContainer: {
        height: '25%',
        backgroundColor: '#afd5efff',
        width: '100%'
    }
})