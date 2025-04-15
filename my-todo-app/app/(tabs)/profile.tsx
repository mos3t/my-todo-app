import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Alert, SafeAreaView, ActivityIndicator, Modal } from 'react-native'
import React, { useEffect, useState } from 'react'
import { getAccounts, updateAccount, deleteAccount } from '../accounts/accountUtils'
import { router } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Ionicons } from '@expo/vector-icons'
import { send, EmailJSResponseStatus } from '@emailjs/react-native';
import { WebView } from 'react-native-webview';

interface AccountData {
  memberID?: number;
  memberSince: string;
  email: string;
  password: string;
  username: string;
  firstname: string;
  lastname: string;
  birthdate: string;
}

// Email sending overlay component
const EmailSendingOverlay = ({ visible, onClose }: { visible: boolean, onClose: () => void }) => {
  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.emailSendingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.emailSendingTitle}>Sending Confirmation Email</Text>
          <Text style={styles.emailSendingText}>Please wait while we process your profile update</Text>
        </View>
      </View>
    </Modal>
  );
};

const Profile = () => {
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<AccountData | null>(null);
  const [showBirthdateConfirm, setShowBirthdateConfirm] = useState(false);
  const [birthdateConfirmation, setBirthdateConfirmation] = useState('');
  const [birthdateError, setBirthdateError] = useState('');
  const [pendingPasswordChange, setPendingPasswordChange] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [emailData, setEmailData] = useState<any>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Function to format date as DD.MM.YYYY
  const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  useEffect(() => {
    const loadAccountData = async () => {
      try {
        // Get the stored user email from AsyncStorage
        const userEmail = await AsyncStorage.getItem('userEmail');
        
        if (!userEmail) {
          setDebugInfo('No user email found in storage');
          return;
        }
        
        const accounts = await getAccounts();
        
        if (accounts.length === 0) {
          setDebugInfo('No accounts found');
          return;
        }

        // Log all accounts for debugging
        accounts.forEach((account, index) => {
          console.log(`Account ${index}:`, account);
        });

        // Find the account with the matching email
        const matchingAccount = accounts.find(account => account.email === userEmail);

        if (matchingAccount) {
          console.log('Found matching account:', matchingAccount);
          // Add memberSince if it doesn't exist
          const accountWithMemberSince = {
            ...matchingAccount,
            memberSince: matchingAccount.memberSince || formatDate(new Date())
          };
          setAccountData(accountWithMemberSince);
        } else {
          console.log('No matching account found');
          setDebugInfo('No account found with the stored email');
        }
      } catch (error) {
        console.error('Error loading account data:', error);
        setDebugInfo(`Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    loadAccountData();
  }, []);

  const handleEdit = () => {
    if (accountData) {
      setEditedData({...accountData});
      setIsEditing(true);
    }
  };

  const sendProfileUpdateEmail = async (oldData: AccountData, newData: AccountData) => {
    try {
      const changes = [];
      if (oldData.username !== newData.username) changes.push(`Username: ${oldData.username} → ${newData.username}`);
      if (oldData.email !== newData.email) changes.push(`Email: ${oldData.email} → ${newData.email}`);
      if (oldData.firstname !== newData.firstname) changes.push(`First Name: ${oldData.firstname} → ${newData.firstname}`);
      if (oldData.lastname !== newData.lastname) changes.push(`Last Name: ${oldData.lastname} → ${newData.lastname}`);
      if (oldData.birthdate !== newData.birthdate) changes.push(`Birth Date: ${oldData.birthdate} → ${newData.birthdate}`);
      if (oldData.password !== newData.password) changes.push('Password was changed');

      const emailParams = {
        to_name: newData.firstname,
        to_email: newData.email,
        changes: changes.join('\n'), // Keep this as is for plain text
        changes_html: changes.join(', '), // Change this line to use a comma instead of <li> tags
      };
      
      setEmailData(emailParams);
      setShowWebView(true);
      setIsSendingEmail(true);
      
      console.log('Profile update email prepared for sending via WebView');
    } catch (error) {
      console.error('Error preparing email:', error);
    }
  };
  
  // Handle WebView message when email is sent
  const handleWebViewMessage = (event: any) => {
    const data = JSON.parse(event.nativeEvent.data);
    if (data.status === 'success') {
      console.log('Email sent successfully via WebView');
      setShowWebView(false);
      setIsSendingEmail(false);
    } else if (data.status === 'error') {
      console.error('Error sending email via WebView:', data.error);
      setShowWebView(false);
      setIsSendingEmail(false);
    }
  };

  const handleSave = async () => {
    if (!editedData || !accountData) return;
    
    // Check if password was changed
    if (editedData.password !== accountData.password) {
      setPendingPasswordChange(true);
      setShowBirthdateConfirm(true);
      return;
    }
    
    try {
      // Use the updateAccount function to update the account in the JSON file
      await updateAccount(editedData);
      
      // Send confirmation email
      await sendProfileUpdateEmail(accountData, editedData);
      
      // Update the local state
      setAccountData(editedData);
      setIsEditing(false);
      
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData(null);
  };

  const handleLogout = async () => {
    try {
      // Clear the stored user email
      await AsyncStorage.removeItem('userEmail');
      // Clear account data
      setAccountData(null);
      // Navigate to login screen
      router.replace('/');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleDeleteAccount = async () => {
    if (!accountData) return;
    
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete the account
              await deleteAccount(accountData.email);
              
              // Clear the stored user email
              await AsyncStorage.removeItem('userEmail');
              
              // Clear account data
              setAccountData(null);
              
              // Navigate to login screen
              router.replace('/');
              
              Alert.alert('Success', 'Your account has been deleted successfully.');
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handlePasswordChange = async () => {
    if (!accountData || !editedData) return;
    
    if (birthdateConfirmation !== accountData.birthdate) {
      setBirthdateError('Incorrect birthdate');
      return;
    }

    setBirthdateError('');
    setShowBirthdateConfirm(false);
    setBirthdateConfirmation('');
    setPendingPasswordChange(false);

    try {
      // Use the updateAccount function to update the account in the JSON file
      await updateAccount(editedData);
      
      // Send confirmation email
      await sendProfileUpdateEmail(accountData, editedData);
      
      // Update the local state
      setAccountData(editedData);
      setIsEditing(false);
      
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {showWebView && emailData ? (
        <View style={{ flex: 1 }}>
          <WebView
            source={{ 
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js"></script>
                </head>
                <body>
                  <script>
                    (function() {
                      emailjs.init("y4xkEsqYCOpPw6_I7");
                      
                      const params = ${JSON.stringify(emailData)};
                      
                      emailjs.send("service_oqpke1j", "change_profile_success", params)
                        .then(function(response) {
                          window.ReactNativeWebView.postMessage(JSON.stringify({status: 'success', response: response}));
                        })
                        .catch(function(error) {
                          window.ReactNativeWebView.postMessage(JSON.stringify({status: 'error', error: error}));
                        });
                    })();
                  </script>
                </body>
                </html>
              `
            }}
            onMessage={handleWebViewMessage}
            style={{ width: 0, height: 0 }}
          />
          <EmailSendingOverlay visible={isSendingEmail} onClose={() => {}} />
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <Text style={styles.title}>My Profile</Text>
            {accountData && !isEditing && (
              <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
                <Ionicons name="pencil" size={20} color="#007AFF" />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.content}>

            
            {accountData ? (
              <View style={styles.infoContainer}>
                {isEditing ? (
                  <>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Member ID:</Text>
                      <Text style={styles.value}>{accountData.memberID || 'Not assigned'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Member Since:</Text>
                      <Text style={styles.value}>{accountData.memberSince}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Username:</Text>
                      <TextInput
                        style={styles.input}
                        value={editedData?.username}
                        onChangeText={(text) => setEditedData(prev => prev ? {...prev, username: text} : null)}
                      />
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Email:</Text>
                      <TextInput
                        style={styles.input}
                        value={editedData?.email}
                        onChangeText={(text) => setEditedData(prev => prev ? {...prev, email: text} : null)}
                      />
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>First Name:</Text>
                      <TextInput
                        style={styles.input}
                        value={editedData?.firstname}
                        onChangeText={(text) => setEditedData(prev => prev ? {...prev, firstname: text} : null)}
                      />
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Last Name:</Text>
                      <TextInput
                        style={styles.input}
                        value={editedData?.lastname}
                        onChangeText={(text) => setEditedData(prev => prev ? {...prev, lastname: text} : null)}
                      />
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Birth Date:</Text>
                      <TextInput
                        style={styles.input}
                        value={editedData?.birthdate}
                        onChangeText={(text) => setEditedData(prev => prev ? {...prev, birthdate: text} : null)}
                      />
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Password:</Text>
                      <TextInput
                        style={styles.input}
                        value={editedData?.password}
                        onChangeText={(text) => setEditedData(prev => prev ? {...prev, password: text} : null)}
                        placeholder="Enter new password"
                      />
                    </View>
                    
                    <View style={styles.buttonContainer}>
                      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                        <Text style={styles.saveButtonText}>Save</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Member ID:</Text>
                      <Text style={styles.value}>{accountData.memberID || 'Not assigned'}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Member Since:</Text>
                      <Text style={styles.value}>{accountData.memberSince}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Username:</Text>
                      <Text style={styles.value}>{accountData.username}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Email:</Text>
                      <Text style={styles.value}>{accountData.email}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>First Name:</Text>
                      <Text style={styles.value}>{accountData.firstname}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Last Name:</Text>
                      <Text style={styles.value}>{accountData.lastname}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Birth Date:</Text>
                      <Text style={styles.value}>{accountData.birthdate}</Text>
                    </View>
                    
                    <View style={styles.buttonContainer}>
                      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Text style={styles.logoutButtonText}>Logout</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
                        <Text style={styles.deleteButtonText}>Delete Account</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            ) : (
              <Text style={styles.loading}>Loading profile data...</Text>
            )}
          </View>
        </ScrollView>
      )}

      {/* Birthdate Confirmation Modal */}
      {showBirthdateConfirm && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Password Change</Text>
            <Text style={styles.modalSubtitle}>Please enter your birth date to confirm the password change</Text>
            
            <TextInput
              style={styles.modalInput}
              value={birthdateConfirmation}
              onChangeText={setBirthdateConfirmation}
              placeholder="Enter your birth date"
            />
            
            {birthdateError ? (
              <Text style={styles.errorText}>{birthdateError}</Text>
            ) : null}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton} 
                onPress={() => {
                  setShowBirthdateConfirm(false);
                  setBirthdateConfirmation('');
                  setBirthdateError('');
                  setPendingPasswordChange(false);
                  setIsEditing(false);
                }}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalConfirmButton} 
                onPress={handlePasswordChange}
              >
                <Text style={styles.modalConfirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  )
}

export default Profile

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e9ecef',
    padding: 8,
    borderRadius: 8,
  },
  editButtonText: {
    marginLeft: 5,
    color: '#007AFF',
    fontWeight: '600',
  },
  debugInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  infoContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 10,
    alignItems: 'center',
  },
  label: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
    marginRight:5
  },
  value: {
    flex: 2,
    fontSize: 16,
    color: '#333',
  },
  input: {
    flex: 2,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 8,
    backgroundColor: '#f9f9f9',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#e9ecef',
    padding: 15,
    borderRadius: 10,
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#555',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
    padding: 15,
    borderRadius: 10,
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loading: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  passwordContainer: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  changePasswordButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  changePasswordButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelButton: {
    padding: 12,
    borderRadius: 8,
  },
  modalCancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
  },
  modalConfirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 14,
    marginBottom: 16,
  },
  webViewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    color: '#333',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
  emailSendingContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
    width: '80%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emailSendingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
    textAlign:'center'
  },
  emailSendingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
})