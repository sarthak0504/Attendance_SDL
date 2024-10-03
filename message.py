import pandas as pd
import sys
import time
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import os

os.environ["CUDA_VISIBLE_DEVICES"] = "-1"  # Disable GPU

# Setup the WebDriver
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()))
baseurl = "https://web.whatsapp.com"

# file_path = 'students_data2.xlsx'

if len(sys.argv) < 2:
    print("Error: No file path provided.")
    sys.exit(1)

file_path = sys.argv[1]
if not os.path.exists(file_path):
    print(f"Error: File does not exist at {file_path}")
    sys.exit(1)

# Load the individual sheets into dataframes
information_df = pd.read_excel(file_path, sheet_name='Information')
# print(information_df.columns)

# Access the values from row 2 (index 0 in the DataFrame)
Subject1 = information_df.loc[0, 'Subject1']
Subject2 = information_df.loc[0, 'Subject2']
Subject3 = information_df.loc[0, 'Subject3']
Subject4 = information_df.loc[0, 'Subject4']
# audio_directory_path = information_df.loc[0, 'AudioDirectoryPath']

# # Print the retrieved values
# print(subject1, subject2, subject3, subject4, audio_directory_path)

attendance_df = pd.read_excel(file_path, sheet_name='Contacts')
contacts_df = pd.read_excel(file_path, sheet_name='Attendance')

# # Merge dataframes on 'Enrollement'
merged_df = pd.merge(attendance_df, contacts_df, on='Enrollement', how='inner')

# # Filter students with a percentage less than 75%
students_below_75 = merged_df[merged_df['Total Percentage'] < 75]
# print(students_below_75)


# # Open WhatsApp Web
driver.get(baseurl)
print("Please scan the QR code within 30 seconds.")
time.sleep(30)  # Adjust as necessary

wait = WebDriverWait(driver, 10)

def send_whatsapp_messages_batch(students):
    for index, row in students.iterrows():
        contact = row['Contact']
        student_name = row['Name']
        percentage = int(row['Total Percentage'])
        sub1 = int(row['Percentage1'])
        sub2 = int(row['Percentage2'])
        sub3 = int(row['Percentage3'])
        sub4 = int(row['Percentage4'])

        message = [
            f"Dear Sir/Mam, Your ward {student_name} has {percentage}% attendance.",
            "Please take some action, otherwise they may be detained.",
            "Below are the subjectwise attendance:",
            f"{Subject1}: {sub1}%",
            f"{Subject2}: {sub2}%",
            f"{Subject3}: {sub3}%",
            f"{Subject4}: {sub4}%"
        ]
        # print(message)

        try:
            search_box = wait.until(EC.presence_of_element_located((By.XPATH, '//div[@contenteditable="true" and @data-tab="3"]')))
            search_box.click()
            search_box.clear()
            search_box.send_keys(f"+91{contact}")
            time.sleep(4)  # Wait for the contact to appear
            search_box.send_keys(Keys.ENTER)

            # Type and send the message
            message_box = wait.until(EC.presence_of_element_located((By.XPATH, '//div[@contenteditable="true" and @data-tab="10"]')))
            message_box.click()

            for line in message:
                message_box.send_keys(line)
                message_box.send_keys(Keys.SHIFT + Keys.ENTER)

            message_box.send_keys(Keys.ENTER)

            time.sleep(4)  # Wait a bit before the next message to avoid issues
        except Exception as e:
            print(f"Failed to send message to {student_name}'s parent ({contact}). Error: {str(e)}")
            time.sleep(4)

    # # Close the driver after all messages are sent
    driver.quit()

send_whatsapp_messages_batch(students_below_75)
