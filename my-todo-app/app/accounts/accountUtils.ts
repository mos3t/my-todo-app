import { Platform, Share, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AccountData {
    email: string;
    password: string;
    username: string;
    firstname: string;
    lastname: string;
    birthdate: string;
    memberSince?: string;
    memberID?: number;
}

// Use both file storage and AsyncStorage for redundancy
const ACCOUNTS_STORAGE_KEY = 'user_accounts';
const ACCOUNTS_DIRECTORY = `${FileSystem.documentDirectory}added-accounts`;
const ACCOUNTS_FILE_PATH = `${ACCOUNTS_DIRECTORY}/accounts.json`;

// Function to ensure the accounts directory exists
const ensureAccountsDirectory = async (): Promise<void> => {
    try {
        const dirInfo = await FileSystem.getInfoAsync(ACCOUNTS_DIRECTORY);
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(ACCOUNTS_DIRECTORY, { intermediates: true });
            console.log('Created accounts directory at:', ACCOUNTS_DIRECTORY);
        }
    } catch (error) {
        console.error('Error ensuring accounts directory exists:', error);
        throw error;
    }
};

// Function to read accounts from file
const readAccountsFromFile = async (): Promise<AccountData[]> => {
    try {
        const fileInfo = await FileSystem.getInfoAsync(ACCOUNTS_FILE_PATH);
        if (!fileInfo.exists) {
            return [];
        }
        
        const content = await FileSystem.readAsStringAsync(ACCOUNTS_FILE_PATH);
        return JSON.parse(content);
    } catch (error) {
        console.error('Error reading accounts from file:', error);
        return [];
    }
};

// Function to write accounts to file
const writeAccountsToFile = async (accounts: AccountData[]): Promise<void> => {
    try {
        await ensureAccountsDirectory();
        await FileSystem.writeAsStringAsync(
            ACCOUNTS_FILE_PATH,
            JSON.stringify(accounts, null, 2)
        );
        console.log('Accounts saved to file successfully');
    } catch (error) {
        console.error('Error writing accounts to file:', error);
        throw error;
    }
};

// Function to find the next available memberID
const findNextMemberID = async (): Promise<number> => {
    try {
        const accounts = await getAccounts();
        if (accounts.length === 0) {
            return 1; // First member gets ID 1
        }
        
        const memberIDs = accounts.map(account => account.memberID || 0);
        const maxID = Math.max(...memberIDs);
        
        // Find the first gap
        for (let i = 1; i <= maxID; i++) {
            if (!memberIDs.includes(i)) {
                return i;
            }
        }
        
        // If no gaps found, return the next number after the highest
        return maxID + 1;
    } catch (error) {
        console.error('Error finding next memberID:', error);
        return 1; // Default to 1 if there's an error
    }
};

export const saveAccount = async (accountData: AccountData): Promise<void> => {
    try {
        // Add current date in DD.MM.YYYY format to memberSince field
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        const formattedDate = `${day}.${month}.${year}`;
        
        // Find the next available memberID
        const nextMemberID = await findNextMemberID();
        console.log('Next available memberID:', nextMemberID);
        
        // Set memberSince field if not already provided and add memberID
        const accountWithDate = {
            ...accountData,
            memberSince: accountData.memberSince || formattedDate,
            memberID: nextMemberID
        };

        // Get existing accounts
        const accounts = await getAccounts();
        
        // Check if email already exists
        if (accounts.some(account => account.email === accountWithDate.email)) {
            throw new Error('An account with this email already exists');
        }
        
        // Add new account
        accounts.push(accountWithDate);
        
        // Save to file
        await writeAccountsToFile(accounts);
        
        // Also save to AsyncStorage for redundancy
        try {
            await AsyncStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
            console.log('Account also saved to AsyncStorage for redundancy');
        } catch (error) {
            console.error('Error saving account to AsyncStorage:', error);
            // Continue even if AsyncStorage fails
        }
        
        // Log the current accounts for visibility
        console.log('Current accounts:', JSON.stringify(accounts, null, 2));
    } catch (error) {
        console.error('Error saving account:', error);
        throw error;
    }
};

export const getAccounts = async (): Promise<AccountData[]> => {
    try {
        // Try to get accounts from file first
        const fileAccounts = await readAccountsFromFile();
        if (fileAccounts.length > 0) {
            console.log('Retrieved accounts from file:', fileAccounts.length);
            return fileAccounts;
        }
        
        // If no accounts in file, try AsyncStorage
        const data = await AsyncStorage.getItem(ACCOUNTS_STORAGE_KEY);
        if (data) {
            const accounts = JSON.parse(data);
            console.log('Retrieved accounts from AsyncStorage:', accounts.length);
            
            // Save to file for future use
            await writeAccountsToFile(accounts);
            
            return accounts;
        }
        
        return [];
    } catch (error) {
        console.error('Error reading accounts:', error);
        return [];
    }
};

// Function to display current accounts in the console
export const displayCurrentAccounts = async (): Promise<void> => {
    try {
        const accounts = await getAccounts();
        console.log('=== CURRENT ACCOUNTS ===');
        console.log(JSON.stringify(accounts, null, 2));
        console.log('=== END OF ACCOUNTS ===');
    } catch (error) {
        console.error('Error displaying accounts:', error);
    }
};

// Function to export accounts to a shared location
export const exportAccounts = async (): Promise<void> => {
    try {
        const accounts = await getAccounts();
        if (accounts.length === 0) {
            console.log('No accounts to export');
            return;
        }
        
        // Create a temporary file in the cache directory
        const tempFile = `${FileSystem.cacheDirectory}accounts.json`;
        await FileSystem.writeAsStringAsync(tempFile, JSON.stringify(accounts, null, 2));
        console.log('Accounts exported to file:', tempFile);
        
        // Check if sharing is available
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
            await Sharing.shareAsync(tempFile, {
                mimeType: 'application/json',
                dialogTitle: 'Export Accounts',
                UTI: 'public.json'
            });
            console.log('Accounts exported successfully');
        } else {
            console.log('Sharing is not available on this device');
        }
    } catch (error) {
        console.error('Error exporting accounts:', error);
    }
};

// Function to export accounts to a visible location on the device
export const exportAccountsToVisibleLocation = async (): Promise<void> => {
    try {
        const accounts = await getAccounts();
        if (accounts.length === 0) {
            Alert.alert('No Accounts', 'There are no accounts to export.');
            return;
        }
        
        // Create a file in the app's document directory
        const filePath = `${FileSystem.documentDirectory}accounts.json`;
        await FileSystem.writeAsStringAsync(filePath, JSON.stringify(accounts, null, 2));
        console.log('Accounts exported to file:', filePath);
        
        // Show success message with file path
        Alert.alert(
            'Accounts Exported',
            `Accounts exported to: ${filePath}\n\nYou can find this file in your device's file system.`,
            [{ text: 'OK' }]
        );
    } catch (error) {
        console.error('Error exporting accounts to visible location:', error);
        Alert.alert('Export Error', 'Failed to export accounts to a visible location.');
    }
};

export const exportAccountsMobile = async () => {
    try {
        // Get accounts from file
        const accounts = await getAccounts();
        const fileContent = JSON.stringify(accounts, null, 2);
        
        if (Platform.OS === 'ios' || Platform.OS === 'android') {
            // Share file on mobile
            await Share.share({
                message: fileContent,
                title: 'Accounts Export'
            });
        } else {
            // For web, create a download
            const blob = new Blob([fileContent], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'accounts.json';
            a.click();
            URL.revokeObjectURL(url);
        }
    } catch (error) {
        console.error('Error exporting accounts:', error);
        throw new Error('Failed to export accounts');
    }
};

export const updateAccount = async (updatedAccount: AccountData): Promise<void> => {
    try {
        // Get current accounts
        const accounts = await getAccounts();
        const accountIndex = accounts.findIndex(acc => acc.email === updatedAccount.email);
        
        if (accountIndex === -1) {
            throw new Error('Account not found for update');
        }
        
        // Preserve the existing memberID and memberSince
        const existingAccount = accounts[accountIndex];
        const accountWithPreservedFields = {
            ...updatedAccount,
            memberID: existingAccount.memberID,
            memberSince: existingAccount.memberSince
        };
        
        // Update account
        accounts[accountIndex] = accountWithPreservedFields;
        
        // Save to file
        await writeAccountsToFile(accounts);
        
        // Also update in AsyncStorage for redundancy
        try {
            await AsyncStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
            console.log('Account also updated in AsyncStorage for redundancy');
        } catch (error) {
            console.error('Error updating account in AsyncStorage:', error);
            // Continue even if AsyncStorage update fails
        }
        
        // Log the current accounts for visibility
        console.log('Current accounts after update:', JSON.stringify(accounts, null, 2));
    } catch (error) {
        console.error('Error updating account:', error);
        throw error;
    }
};

// Function to delete an account
export const deleteAccount = async (email: string): Promise<void> => {
    try {
        // Get current accounts
        const accounts = await getAccounts();
        const updatedAccounts = accounts.filter(account => account.email !== email);
        
        if (updatedAccounts.length === accounts.length) {
            throw new Error('Account not found for deletion');
        }
        
        // Save to file
        await writeAccountsToFile(updatedAccounts);
        
        // Also delete from AsyncStorage for redundancy
        try {
            await AsyncStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(updatedAccounts));
            console.log('Account also deleted from AsyncStorage for redundancy');
        } catch (error) {
            console.error('Error deleting account from AsyncStorage:', error);
            // Continue even if AsyncStorage deletion fails
        }
        
        // Log the current accounts for visibility
        console.log('Current accounts after deletion:', JSON.stringify(updatedAccounts, null, 2));
    } catch (error) {
        console.error('Error deleting account:', error);
        throw error;
    }
}; 