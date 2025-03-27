import {supabase} from "../lib/supabase";
const API_URL = 'https://kfrjzfshvxouvzppwkad.supabase.co/functions/v1/api';

export const deleteUserData = async (userId: string) => {
    await supabase
    .from('ChatMessages')
    .delete()
    .eq('senderId', userId);

    await supabase
    .from('Users')
    .delete()
    .eq('user_id', userId); 

    try{
        await fetch(`${API_URL}/delete-user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId }),
        });
    } catch (error) {
        console.error('Error deleting user auth:', error);
    }
   
};
