import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native'
import React from 'react'

interface TextButtonComponentProps {
    onPress: () => void,
    backgroundColor: string,
    title: string,
    position?: ViewStyle,
    disable?: boolean,
}

const TextButtonComponent: React.FC<TextButtonComponentProps> = ({ onPress, backgroundColor, title, position, disable }) => {
    return (
        <TouchableOpacity onPress={onPress}
         style={[styles.btn, {
            backgroundColor:backgroundColor,
            position: 'absolute', ...position 
            }]}>
            <Text style={styles.textStyle}>{title}</Text>
        </TouchableOpacity>
    )
}

export default TextButtonComponent

const styles = StyleSheet.create({
    btn: {
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
        height: 45,
        width: 150,
        padding:10
    },
    textStyle: {
        fontSize: 16,
        fontWeight: 600,
        color: '#fff'
    },
})