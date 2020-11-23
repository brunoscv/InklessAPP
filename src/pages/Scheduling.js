import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, StatusBar, Image, TouchableOpacity, ActivityIndicator, PermissionsAndroid, Alert } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowLeft, faUserCircle, faCheckCircle, faPhoneSquareAlt } from '@fortawesome/free-solid-svg-icons';
import { ScrollView } from 'react-native-gesture-handler';
import { format, parseISO } from "date-fns";
import Geolocation from 'react-native-geolocation-service';
import * as geolib from 'geolib';

import api from '../services/api';
import axios from 'axios';
import NetInfo from "@react-native-community/netinfo";
import messaging from '@react-native-firebase/messaging';

import logo from '../../assets/st.png';

// import { Container } from './styles';

export default function Scheduling({ navigation }) {

    const [schedulings, setSchedulings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hasLocationPermission, setHasLocationPermission] = useState(false);
    const [hasCheckin, setCheckin] = useState(false);
    const [alertLoading, setAlertLoading] = useState(false);
    const [callLoading, setCallLoading] = useState(false);
    const [connState, setConnState] = useState(0);
    const [response, setResponse] = useState([]);

    useEffect(() => {
        NetInfo.fetch().then(state => {
          setConnState(state);
        });
    
        const unsubscribe = NetInfo.addEventListener(state => {
          setConnState(state);
        });
    
        return () => {
          unsubscribe();
        };
    }, []);

    /** FIREBASE NOTIFICATION NAVIGATOR */
  useEffect(() => {
    requestUserPermission();
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      //Alert.alert('A new FCM message arrived!', JSON.stringify(remoteMessage.data));
      Alert.alert(
        remoteMessage.data.title,
        remoteMessage.data.body,
        [
          {text: 'OK', onPress: () => navigation.navigate(remoteMessage.data.screen)},
        ],
        {cancelable: false},
      );
    });
    messaging().onNotificationOpenedApp(remoteMessage => {
        navigation.navigate(remoteMessage.data.screen);
      });
      messaging().setBackgroundMessageHandler(async remoteMessage => {
        navigation.navigate(remoteMessage.data.screen);
      });
    return unsubscribe;
   }, []);

  requestUserPermission = async () => {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      getFcmToken();
    }
  }

  getFcmToken = async () => {
    const fcmToken = await messaging().getToken();
  }
  /** FIREBASE NOTIFICATION NAVIGATOR */

    async function verifyLocationPermission() {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
          );
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            setHasLocationPermission(true);
          } else {
            setHasLocationPermission(false);
          }
        } catch (err) {
          console.warn(err);
        }
    }

    useEffect(() => {
        async function loadSchedulings() {
            const user_id = 30059;
            const response = await api.get('/mobile/checkinid/' + user_id, { responseType: 'json' });
            //O response retorna como objeto no Inkless
            //É preciso dar um cast para array, como é feito abaixo.
            const arrResponse = []
            Object.keys(response.data.schedulings).forEach(key => arrResponse.push(response.data.schedulings[key]));
            //console.log(response.data.schedulings)
            setSchedulings(arrResponse);
            setLoading(!loading);
        }
        loadSchedulings();
    }, []);

    async function realizarCheckin(scheduling_id) {
        setAlertLoading(true);
        const response = await api.get('/inklessapp/schedulingcheckin/' + scheduling_id, { responseType: 'json' });
        const message = JSON.stringify(response.data);
        if(response.status = 200) {
            setAlertLoading(false);
            console.log(loading);
            Alert.alert("", response.data.message, [
                {
                    text: "OK",
                    onPress: () => navigation.navigate('Reloadscheduling')
                }
            ]);
        } else {
            setAlertLoading(false);
            Alert.alert("Houve um erro", "Check-In não pôde ser realizado", [
                {
                    text: "OK",
                    onPress: () => navigation.navigate('Reloadscheduling')
                }
            ]);
        } 
    }

    async function checkinConsulta(scheduling_id) {
        verifyLocationPermission();
        Geolocation.getCurrentPosition(
            ( position ) => {
                const dist = geolib.getDistance(position.coords, {
                    latitude: -5.091214,
                    longitude: -42.806561,
                });
                // if(dist > 200) {
                //     Alert.alert('Confirmação', 'Você precisa estar próximo ao local da consulta para realizar o Check-In');
                // }
                if(dist <= 20000000000) {
                    realizarCheckin(scheduling_id);
                }
            },
            () => {
                Alert.alert('Não foi possível obter sua localização. Por favor verique suas permissões e/ou conexão com Internet');
            }
        ); 
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" style={styles.statusBar}/>

            <View style={{backgroundColor: '#004ba0'}}>
                <View style={ {backgroundColor: '#1976d2', padding: 10, borderBottomLeftRadius: 15, borderBottomRightRadius: 15, flexDirection: 'row'} }>
                    <TouchableOpacity  onPress={() => navigation.navigate('Menu') } style={{padding: 5}}>
                        <FontAwesomeIcon icon={ faArrowLeft } size={20} color="#fff"/>
                    </TouchableOpacity>
                
                    <View><Text style={{color: '#fff', fontSize: 20, fontWeight: '400'}}>Check-In</Text></View>
                </View>
            </View>

            <ScrollView style={{
                flex: 1, 
                backgroundColor: "#f5f5f5", 
                borderTopLeftRadius: 30, 
                borderTopRightRadius: 30}}>
                    <View style={styles.titleBlock}>
                        <Text style={styles.subnameBlock}>{"Anna Renatta"}</Text>
                    </View>
                    <View>
                        <Text style={{paddingHorizontal: 10, paddingVertical: 20}}>Todos os check-in's</Text>
                    </View>
                    {!loading ? 
                        schedulings.length > 0 ? 
                            schedulings.map(scheduling => 
                                <View key={scheduling.id} style={{ 
                                    backgroundColor: '#fff', 
                                    marginHorizontal: 10,
                                    marginVertical: 4,
                                    paddingHorizontal: 14,
                                    paddingVertical: 10,
                                    borderRadius: 20 }}>
                                    <View style={styles.cardBody} >
                                    <Image style={styles.cardAvatar} source={{uri: 'https://demo.denarius.digital/storage/' + scheduling.professional_image}}/>
                                        <View style={styles.cardLeftSide} >
                                            <Text style={styles.cardName} >Dr(a). {scheduling.professional_name}</Text>
                                            <Text style={styles.cardTime} >{ format(parseISO(scheduling.date_scheduling), "dd/MM/yyyy") } às { scheduling.time_starting_booked }</Text>
                                            <Text style={styles.cardAddress} >{ scheduling.video_appointment == true ? <Text>Teleconsulta</Text> : <Text>Consulta Presencial</Text>} - Hospital Gastrovita</Text>
                                            <Text style={styles.cardAddress} >Não Atendido</Text>
                                        </View>
                                    </View>
                                    <View style={styles.cardFooter}>
                                        { scheduling.check_in == "Red"
                                            ?   <TouchableOpacity style={styles.dangerButton}>
                                                    <FontAwesomeIcon icon={ faCheckCircle } size={20} color="#fff"/>
                                                    <Text style={styles.buttonText}>Check-In Indisponível</Text>
                                                </TouchableOpacity>
                                            : (
                                                scheduling.check_in == "Green" ?   
                                                <TouchableOpacity style={styles.successButton}>
                                                    <FontAwesomeIcon icon={ faCheckCircle } size={20} color="#fff"/>
                                                    <Text style={styles.buttonText}>Check-In Feito</Text>
                                                </TouchableOpacity>
                                                :   (
                                                    scheduling.video_appointment == true ? 
                                                    <TouchableOpacity onPress={ () => realizarCheckin(scheduling.id) } style={styles.primaryButton}>
                                                        <FontAwesomeIcon icon={ faCheckCircle } size={20} color="#fff"/>
                                                        <Text style={styles.buttonText}>Fazer Check-In</Text>
                                                    </TouchableOpacity> 
                                                    :
                                                    <TouchableOpacity onPress={ () => checkinConsulta(scheduling.id) } style={styles.primaryButton}>
                                                        {alertLoading ? <ActivityIndicator size="small" color="#0000ff" style={{alignItems: 'center', justifyContent: 'center'}}/> : <FontAwesomeIcon icon={ faCheckCircle } size={20} color="#fff"/>}
                                                        <Text style={styles.buttonText}>Fazer Check-In</Text>
                                                    </TouchableOpacity> 
                                                )
                                            )
                                        } 
                                        
                                        {
                                            scheduling.session_id && scheduling.session_token 
                                            ?  <TouchableOpacity onPress={ () => navigation.navigate('Video', { apiKey: `${scheduling.apiKey}`, sessionId: `${scheduling.session_id}`, tokenId: `${scheduling.session_token}` })} style={styles.callButton}>
                                                    <View style={{flexDirection: 'row', justifyContent:'center', alignItems: 'center'}}>
                                                        <FontAwesomeIcon icon={ faPhoneSquareAlt } size={20} color="#fff"/>
                                                        <Text style={styles.buttonText}>Atender Chamada</Text>
                                                    </View>
                                                </TouchableOpacity> 
                                            : <Text></Text>
                                        }
                                        {/* <View>
                                            <TouchableOpacity  onPress={ () => handle(scheduling.id) } style={styles.successButton}>
                                            {callLoading ? <ActivityIndicator size="small" color="#0000ff" style={{alignItems: 'center', justifyContent: 'center'}}/> : <FontAwesomeIcon icon={ faCheckCircle } size={20} color="#fff"/>}
                                                <Text style={styles.buttonText}>Meet Call</Text>
                                            </TouchableOpacity>
                                        </View> */}
                                    </View>
                                </View>
                            ) 
                        : 
                        <View style={{alignItems: 'center', justifyContent: 'center'}}>
                            <View style={{width: 400, height:200, paddingHorizontal: 10, paddingVertical: 10}}>
                                <Image style={{width: 400, height:200, resizeMode: 'contain' }} source={logo}/>
                            </View>
                            <View style={{padding: 20}}>
                                <Text style={{color: '#004ba0', fontSize: 16, fontWeight: 'bold'}}>Olá! Nós não encontramos registros de agendamentos para hoje. Esperamos ansiosamente pelo seu atendimento.</Text>
                            </View>
                        </View>
                    :
                    <View style={{
                        flex: 1,
                        backgroundColor: '#fff', 
                        marginHorizontal: 10,
                        marginVertical: '30%',
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        borderRadius: 20,
                        alignItems: 'center', justifyContent: 'center'}}>
                        <ActivityIndicator size="large" color="#0000ff"/>
                        <Text style={{color: '#222', marginVertical: 10}}>Carregando ...</Text>
                    </View>
                    }
                
            </ScrollView>
        </View>
    );
}

                                  

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    statusBar: {
        backgroundColor: '#1976d2',
        color: '#fff'
    },
    actionsBlock: {
        backgroundColor: '#1976d2',
    },
    backBlock: {
        backgroundColor: '#1976d2',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    rightBlock: {
        flexDirection: 'row',
    },
    titleBlock: {
        backgroundColor: '#004ba0',
        padding: 15,
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15
    },
    nameBlock: {
        color: '#fff',
        fontSize: 16,
    },
    subnameBlock: {
        color: '#fff',
        fontSize: 30,
    },
    cardAvatar: {
        height: 60,
        width: 60,
        backgroundColor: 'gray',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 20
    },
    cardBody: {
        flexDirection: 'row',
        shadowColor: '#000',
        shadowOffset: {width:0, height: 2},
        shadowOpacity: 0.2,
        shadowRadius: 4
    },
    cardFooter: {
        flexDirection: 'row', 
        justifyContent:'center', 
        alignItems: 'center'
    },
    cardLeftSide: {
        paddingHorizontal: 10,
        flex: 1
    },  
    cardName: {
        color: '#222',
        fontSize: 18,
        fontWeight: 'bold'
    },
    cardTime: {
        color: '#222',
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 5
    },
    cardAddress: {
        color: 'gray',
        fontSize: 15,
        fontWeight: '500',
        marginTop: 5
    },
    iconMore: {
        position: 'absolute',
        bottom: 3,
        right: 0,
    },
    cardActionButtons: {

    },
    checkinButton: {
        backgroundColor: '#1976d2',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius:4,
        margin: 2,
        padding: 4,
    },
    callButton: {
        backgroundColor: '#388e3c',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius:4,
        margin: 2,
        padding: 4,
    },
    dangerButton: {
        backgroundColor: '#d32f2f',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius:4,
        margin: 2,
        padding: 4,
        flexDirection: 'row'
    },
    successButton: {
        backgroundColor: '#388e3c',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius:4,
        margin: 2,
        padding: 4,
        flexDirection: 'row'
    },
    primaryButton: {
        backgroundColor: '#1976d2',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius:4,
        margin: 2,
        padding: 4,
        flexDirection: 'row'
    },
    navButton: {

    },
    buttonText: {
        color:'#fff',
        fontWeight: 'bold',
        fontSize: 14,
        marginHorizontal: 10
    }
});