/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  FlatList,
} from "react-native";
import { Ilocations } from "../screens/home/types";

const { height } = Dimensions.get("window");

interface IBottomSheet { 
    visible:boolean,
    onClose:() => void,
    data:Ilocations[],
    completedWaypoints:number
}

const BottomSheet:React.FC<IBottomSheet> = ({ visible, onClose, data, completedWaypoints}) => {
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="none">
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <Animated.View
        style={[
          styles.sheet,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={styles.handle} />
        <View style={styles.container}>
        <Text style={styles.progress}>Progress: Reached {completedWaypoints} of {data.length} waypoints</Text>
        <FlatList
            data={data}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({item}) => (
                <View style={[styles.itemContainer,{backgroundColor:completedWaypoints >= item.id ? 'green' : '#ccc' }]}>
                    <Text style={[styles.textStyle,{color:completedWaypoints >= item.id ? '#FFF' : '#000' }]}>{item.location}</Text>
                </View>
            )} />
        </View>
      </Animated.View>
    </Modal>
  );
};

export default BottomSheet;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight:200,
    // flexShrink:1,
  },
  container: {
    paddingBottom: 20,
    borderRadius:10
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: "#ccc",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 10,
  },
  textStyle:{
    fontSize: 16,
    fontWeight: 700,
    color: '#000'
  },
  itemContainer:{
     padding:10,
     backgroundColor:'#ccc',
     marginBottom:10,
     borderRadius:5
  },
  progress:{
    fontSize: 18,
    fontWeight: 700,
    color: '#000',
    marginBottom:10
  }
});
