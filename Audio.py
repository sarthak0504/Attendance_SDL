import pandas as pd
import time
import os
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from gtts import gTTS
import pyautogui

# Setup the WebDriver
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))
baseurl = "https://web.whatsapp.com"

file_path = 'students_data2.xlsx'

information_df = pd.read_excel(file_path, sheet_name='Information')
# print(information_df.columns)

# Access the values from row 2 (index 0 in the DataFrame)
Subject1 = information_df.loc[0, 'Subject1']
Subject2 = information_df.loc[0, 'Subject2']
Subject3 = information_df.loc[0, 'Subject3']
Subject4 = information_df.loc[0, 'Subject4']
AudioDirectory = information_df.loc[0, 'AudioDirectoryPath']
print(AudioDirectory)

# Load the individual sheets into dataframes
attendance_df = pd.read_excel(file_path, sheet_name='Attendance')
contacts_df = pd.read_excel(file_path, sheet_name='Contacts')

# Merge dataframes on 'Enrollement'
merged_df = pd.merge(attendance_df, contacts_df, on='Enrollement', how='inner')

# Filter students with a percentage less than 75%
students_below_75 = merged_df[merged_df['Total Percentage'] < 75]


# AudioDirectory = "C:\\Users\\ASUS\\Desktop\\pro\\AudioMessage"
# Ensure the AudioDirectory is an absolute path
if not os.path.exists(AudioDirectory):
    os.makedirs(AudioDirectory)
# Open WhatsApp Web
driver.get(baseurl)
print("Please scan the QR code within 30 seconds.")
time.sleep(30)  # Adjust as necessary

wait = WebDriverWait(driver, 10)

def convert_text_to_audio(message, file_path):
    tts = gTTS(text=message, lang='en')
    tts.save(file_path)

def send_whatsapp_messages_batch(students):
    for index, row in students.iterrows():
        contact = row['Contact']
        student_name = row['Name']
        percentage = int(row['Total Percentage'])
        sub1 = int(row['Percentage1'])
        sub2 = int(row['Percentage2'])
        sub3 = int(row['Percentage3'])
        sub4 = int(row['Percentage4'])

        message = (f"Dear Sir Mam, Your ward {student_name} has {percentage}% attendance. Please take some action, otherwise they may be detained. Here are the subjectwise attendance in {Subject1} {sub1}% , {Subject2}  {sub2}% , in {Subject3} {sub3}% , in {Subject4} {sub4}%")
          # Absolute path in the specified directory
        

        audio_file = f"message_{index}.mp3"
        audio_path = os.path.join(AudioDirectory, audio_file)

        # Convert text message to audio
        convert_text_to_audio(message, audio_path)
        print(f"Audio file created at: {audio_path}")
        time.sleep(2)

        try:
            # Search for the contact
            search_box = wait.until(EC.presence_of_element_located((By.XPATH, '//div[@contenteditable="true" and @data-tab="3"]')))
            search_box.click()
            search_box.clear()
            search_box.send_keys(f"+91{contact}")
            time.sleep(4)  # Wait for the contact to appear
            search_box.send_keys(Keys.ENTER)

            # Attach file
            attach_button = wait.until(EC.presence_of_element_located((By.XPATH, '//div[@title="Attach"]')))
            attach_button.click()
            time.sleep(3)
            
            # Upload audio file
            audio_button = wait.until(EC.presence_of_element_located((By.XPATH, '//li[@data-animate-dropdown-item="true" and @style="opacity: 1;"]')))
            audio_button.click()
            time.sleep(2)

            # file_input = driver.find_element(By.XPATH, '//input[@type="file"]')  # Locate the file input element
            # file_input.send_keys(audio_path)

            pyautogui.write(audio_path)
            pyautogui.press('enter')

            # audio_button.send_keys(audio_path)  # Use absolute path
            print(f"Audio file uploaded: audio_path") 
            time.sleep(2)

            # Send button
            send_button = wait.until(EC.presence_of_element_located((By.XPATH, '//span[@data-icon="send"]')))
            send_button.click()
            print(f"Audio message sent to {student_name}'s parent ({contact}).")
            
            time.sleep(2)  # Wait a bit before the next message to avoid issues
            if os.path.exists(audio_path):
                os.remove(audio_path)
                print(f"Audio file deleted: {audio_path}")
            else:
                print(f"Audio file not found for deletion: {audio_path}")
            
        except Exception as e:
            print(f"Failed to send audio message to {student_name}'s parent ({contact}). Error: {str(e)}")
            time.sleep(2)

    # Close the driver after all messages are sent
    driver.quit()

send_whatsapp_messages_batch(students_below_75)
