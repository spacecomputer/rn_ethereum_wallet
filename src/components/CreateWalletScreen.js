import React, { Component } from 'react';
import { StyleSheet, View, AsyncStorage, Clipboard, Platform } from 'react-native';
import { Container, Content, Text, Button, Form, Textarea, Toast, Icon, Header, Left, Body, Title, Right } from 'native-base'; 
import { NavigationActions } from 'react-navigation';

import bip39 from 'react-native-bip39';
import bip32 from 'bip32';
import ethUtil from 'ethereumjs-util';
import { ethers } from 'ethers';
import { randomBytes } from 'react-native-randombytes'

import RNSecureKeyStore, {ACCESSIBLE} from "react-native-secure-key-store";
import Loader from './Loader';

export default class CreateWalletScreen extends Component {
  // static navigationOptions = {
	// 	header: null,
	// }
	
	constructor(props) {
		super(props);

		this.state = {
			mnemonic: null,
			loading: false,
		}
	}

	componentWillMount = () => {
		// 니모닉 생성
		randomBytes(16, (error, bytes) => {
			const mnemonic = ethers.utils.HDNode.entropyToMnemonic(bytes, ethers.wordlists.en);
			this.setState({ mnemonic })
		})
	}

	_storeData = async (wallet, privateKey) => {
		// TODO: secureStorage에 니모닉을 저장하자.
		// TODO: walletStorage에는 derivePath를 저장하자.
		// TODO: WALLETS을 Object로 저장하자

		try {
			let wallets = JSON.parse(await AsyncStorage.getItem('WALLETS')) || {};
			// wallets.push(wallet);
			wallets[wallet.address.toLowerCase()] = wallet;
			console.log('wallets', wallets, JSON.stringify(wallets));
			await AsyncStorage.setItem('WALLETS', JSON.stringify(wallets));
			await RNSecureKeyStore.set(wallet.address, privateKey, {accessible: ACCESSIBLE.ALWAYS_THIS_DEVICE_ONLY});

			// console.log(await AsyncStorage.getItem('WALLETS'));
		} catch (error) {
			// Error saving data
			console.log(error);
		}
	};

	createWallet = async () => {

		this.setState({
      loading: true
		});

		const wallets = {
			'ETH':{},
			'BTC':{},
			'XLM':{}
		}
		
		// 마스터 키 생성
		const seed = bip39.mnemonicToSeed(this.state.mnemonic);
		const root = bip32.fromSeed(seed);

		// 비트코인 차일드 개인키 생성
		((coin='BTC') => {
			const derivePath = "m/44'/0'/0'/0/0";
			const xPrivKey = root.derivePath(derivePath);
			const privKey = xPrivKey.privateKey.toString('hex');
	
			// 비트코인 주소 생성
			let address = '';
			// let address = ethUtil.pubToAddress(xPrivKey.publicKey, true).toString('hex');
			// address = ethUtil.toChecksumAddress(address).toString('hex');

			wallets[coin][address] = {
				name: '비트코인',
				coin: 'BTC',
				symbol: 'BTC',
				address,
				derivePath,
			}
		})();

		// 이더리움 차일드 개인키 생성
		((coin='ETH') => {
			const derivePath = "m/44'/60'/0'/0/0";
			const xPrivKey = root.derivePath(derivePath);
			const privKey = xPrivKey.privateKey.toString('hex');
	
			// 이더리움 주소 생성
			let address = ethUtil.pubToAddress(xPrivKey.publicKey, true).toString('hex');
			address = ethUtil.toChecksumAddress(address).toString('hex');

			wallets[coin][address] = {
				name: '이더리움',
				coin: 'ETH',
				symbol: 'ETH',
				address,
				derivePath,
			}
		})();
		
		// 스텔라루멘 키 저장

		// alert(address);
    const wallet = {
      name: '이더리움',
      coinType: 'ETH',
      symbol: 'ETH',
      address
		}

		/*
			wallets = {
				'eth': {
					address': {}
				},
				'btc': {
					address': {}
				}
			}
		*/
		
		//

		// 저장(지갑 3개를 동시에 생성하고 redux로 저장하자.)
		// 니모닉 저장, 이더리움 키저장, 비트코인 키 저장, 스텔라루멘 키 저장
		// 그리고 앱 상태를 지갑 생성 완료로 변경하자.
		await this._storeData(wallet, privKey);

		this.setState({
      loading: false
		});

		// this.props.navigation.goBack();
		// this.props.navigation.popToTop();
		// 지갑 생성이 완료되면 현재 화면을 종료하고 지갑 목록 화면으로 이동한다.
		this.props.navigation.reset([NavigationActions.navigate({ routeName: 'Wallets' })], 0)
	}

  render() {
    return (
			<Container style={styles.container}>
				<Header>
					<Left>
						<Button transparent
							onPress={() => this.props.navigation.goBack()}>
							<Icon name="arrow-back" />
						</Button>
					</Left>
					<Body>
						<Title>지갑 만들기</Title>
					</Body>
					<Right />
				</Header>
				<View style={{ flex: 1, padding: 10, justifyContent: 'space-between'}}>
					<View>
						<Text note style={{paddingVertical: 10}}>
							아래 12개 니모닉을 복사하여 백업하세요. 지갑을 복구하는데 매우 중요한 데이터입니다.
						</Text>
						<Form>
							<Textarea rowSpan={5} bordered disabled 
								style={styles.mnemonic}
								value={this.state.mnemonic} />
						</Form>
						{/* <Button><Text>복사하기</Text></Button> */}
					</View>
				</View>
				<View style={{ marginHorizontal: 10, marginBottom: 30 }}>
					<Button block primary
						disabled={this.state.loading}
						onPress={() => this.createWallet()}>
						<Text>생성하기</Text>
					</Button>
				</View>
				<Loader loading={this.state.loading} />
      </Container>
		);
  }
}

const styles = StyleSheet.create({
  container: {
		flex: 1,
		backgroundColor: 'white',
	},
	mnemonic: {
		...Platform.select({ 
			android: { 
				fontFamily:'monospace' 
			}
		}),
	}
});