import pandas as pd
import matplotlib.pyplot as plt

# Replace 'data.csv' with your actual file path
file_path = 'data.csv'

# Read the CSV file without header, and assign column names
df = pd.read_csv(file_path, header=None, names=['Datetime', 'Value'])

# Convert the 'Datetime' column to a pandas datetime object
df['Datetime'] = pd.to_datetime(df['Datetime'], format='%d %B %Y %H:%M %Z')

# Plot the data
plt.figure(figsize=(10, 6))
plt.plot(df['Datetime'], df['Value'], marker='o', linestyle='-', color='b')

# Adding labels and title
plt.xlabel('Datetime')
plt.ylabel('Value')
plt.title('Value over Time')
plt.xticks(rotation=45)

# Display the plot
plt.tight_layout()
plt.show()
