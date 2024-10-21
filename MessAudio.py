import pandas as pd
import time
import os
import sys
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from gtts import gTTS

# Setup WebDriver for Chrome using ChromeDriverManager (Web Only)
def setup_driver():
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))
    return driver

# Verify the file path provided
def verify_file_path(file_path):
    if not os.path.exists(file_path):
        print(f"Error: File does not exist at {file_path}")
        sys.exit(1)

# Load data from Excel file
def load_data(file_path):
    try:
        information_df = pd.read_excel(file_path, sheet_name='Information')
        attendance_df = pd.read_excel(file_path, sheet_name='Attendance')
        contacts_df = pd.read_excel(file_path, sheet_name='Contacts')
        return information_df, attendance_df, contacts_df
    except Exception as e:
        print(f"Error loading Excel data: {e}")
        sys.exit(1)

# Merge attendance and contact data
def merge_data(attendance_df, contacts_df):
    try:
        merged_df = pd.merge(attendance_df, contacts_df, on='Enrollement', how='inner')
        students_below_75 = merged_df[merged_df['Total Percentage'] < 75]
        return students_below_75
    except KeyError as e:
        print(f"Error: Missing column {e} in data.")
        sys.exit(1)

# Convert text to audio
def convert_text_to_audio(message, file_path):
    tts = gTTS(text=message, lang='en')
    tts.save(file_path)

# Send messages via WhatsApp Web
def send_whatsapp_messages_batch(students, driver, subject_names):
    wait = WebDriverWait(driver, 10)
    for index, row in students.iterrows():
        contact = row['Contact']
        student_name = row['Name']
        percentage = int(row['Total Percentage'])
        sub1 = int(row['Percentage1'])
        sub2 = int(row['Percentage2'])
        sub3 = int(row['Percentage3'])
        sub4 = int(row['Percentage4'])

        # Create the message text
        message = (f"Dear Sir/Mam, Your ward {student_name} has {percentage}% attendance. "
                   f"Please take some action, otherwise they may be detained. Here are the subject-wise attendance: "
                   f"{subject_names[0]}: {sub1}%, {subject_names[1]}: {sub2}%, {subject_names[2]}: {sub3}%, {subject_names[3]}: {sub4}%.")

        try:
            # Open WhatsApp Web chat with unsaved number using web.whatsapp.com
            chat_url = f"https://web.whatsapp.com/send?phone=91{contact}&text={message}"
            driver.get(chat_url)
            time.sleep(10)  # Give time for WhatsApp Web to load the chat window

            # Wait for the 'Send' button to be clickable, then click
            send_button = wait.until(EC.presence_of_element_located((By.XPATH, '//span[@data-icon="send"]')))
            send_button.click()
            print(f"Message sent to {student_name}'s parent ({contact}).")
            
            time.sleep(5)  # Wait a bit before sending the next message
            
        except Exception as e:
            print(f"Failed to send message to {student_name}'s parent ({contact}). Error: {str(e)}")
            time.sleep(2)

# Main function to execute the script
def main():
    if len(sys.argv) < 2:
        print("Error: No file path provided.")
        sys.exit(1)

    file_path = sys.argv[1]
    verify_file_path(file_path)

    # Load data from the Excel file
    information_df, attendance_df, contacts_df = load_data(file_path)

    # Extract subject names from the 'Information' sheet
    subject_names = [
        information_df.loc[0, 'Subject1'],
        information_df.loc[0, 'Subject2'],
        information_df.loc[0, 'Subject3'],
        information_df.loc[0, 'Subject4']
    ]

    # Merge data and filter students below 75% attendance
    students_below_75 = merge_data(attendance_df, contacts_df)

    # Setup WebDriver and open WhatsApp Web
    driver = setup_driver()
    driver.get("https://web.whatsapp.com")
    print("Please scan the QR code within 30 seconds.")
    time.sleep(30)  # Adjust based on how quickly the QR code is scanned

    # Send WhatsApp messages to students' parents
    send_whatsapp_messages_batch(students_below_75, driver, subject_names)

    # Close the WebDriver after messages are sent
    driver.quit()

if __name__ == "__main__":
    main()
