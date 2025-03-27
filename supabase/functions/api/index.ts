// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import express from 'npm:express@4.18.2'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import process from "node:process"; 

const app = express()

// Add middleware to parse JSON bodies
app.use(express.json())
 
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseSecret = process.env.EXPO_PUBLIC_SUPABASE_SECRET_KEY

const supabase = createClient(supabaseUrl, supabaseSecret);

app.post('/api/delete-user', async (req:any, res:any) => {
  try{ 
    if (!req.body || !req.body.userId) {
      return res.status(400).json({ status: 'Error', message: 'userId is required' });
    }
    const { data, error } = await supabase.auth.admin.deleteUser(req.body.userId)
    
    if (error) {
      return res.status(400).json({ status: 'Error', message: error.message });
    }
    res.json({ status: 'Process Done', data  }) 
  } catch (ex:any) {
    console.log("delete-user",ex.message)
    res.status(500).json({ status: 'Error', message: ex.message })
  }
})

 
app.listen(3050, () => {
  console.log('Server started on port 3050')
})