import pandas as pd
import sys
import os
import pywhatkit as pwk
import pyautogui
import time

# Check if file path is provided
if len(sys.argv) < 2:
    print("Error: No file path provided.")
    sys.exit(1)

file_path = sys.argv[1]
if not os.path.exists(file_path):
    print(f"Error: File does not exist at {file_path}")
    sys.exit(1)

# Load data from Excel file
information_df = pd.read_excel(file_path, sheet_name='Information')

# Access subject information
Subject1 = information_df.loc[0, 'Subject1']
Subject2 = information_df.loc[0, 'Subject2']
Subject3 = information_df.loc[0, 'Subject3']
Subject4 = information_df.loc[0, 'Subject4']

attendance_df = pd.read_excel(file_path, sheet_name='Contacts')
contacts_df = pd.read_excel(file_path, sheet_name='Attendance')

# Merge dataframes on 'Enrollement'
merged_df = pd.merge(attendance_df, contacts_df, on='Enrollement', how='inner')

# Filter students with attendance less than 75%
students_below_75 = merged_df[merged_df['Total Percentage'] < 75]

def send_whatsapp_messages_batch(students):
    print("Please scan the QR code on WhatsApp Web if prompted.")
    time.sleep(10)  # Give enough time to scan the QR code

    for index, row in students.iterrows():
        contact = str(row['Contact'])  # Convert contact to string
        student_name = row['Name']
        percentage = int(row['Total Percentage'])
        sub1 = int(row['Percentage1'])
        sub2 = int(row['Percentage2'])
        sub3 = int(row['Percentage3'])
        sub4 = int(row['Percentage4'])

        # Remove any non-numeric characters, make sure it's valid, and append the country code
        contact = ''.join(filter(str.isdigit, contact))  # Keep only digits
        if not contact.startswith("91"):
            contact = f"91{contact}"  # Add '91' if not already present

        # Create message content
        message = (
            f"Dear Sir/Mam, Your ward {student_name} has {percentage}% attendance.\n"
            "Please take some action, otherwise they may be detained.\n"
            "Below are the subjectwise attendance:\n"
            f"{Subject1}: {sub1}%\n"
            f"{Subject2}: {sub2}%\n"
            f"{Subject3}: {sub3}%\n"
            f"{Subject4}: {sub4}%"
        )

        try:
            # Send the message using pywhatkit
            pwk.sendwhatmsg_instantly(f"+{contact}", message, wait_time=10, tab_close=False)

            # Wait for WhatsApp to type the message
            time.sleep(10)  # Adjust wait time based on your internet speed

            # Simulate pressing Enter to send the message
            pyautogui.press("enter")
            print(f"Message sent successfully to {student_name}'s parent (+{contact}).")
            time.sleep(10)  # Give some time before the next message is sent

        except Exception as e:
            print(f"Failed to send message to {student_name}'s parent (+{contact}). Error: {str(e)}")
            time.sleep(5)

send_whatsapp_messages_batch(students_below_75)
