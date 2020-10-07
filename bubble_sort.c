#include <stdio.h>

void print_array(int array_length, int array[]);
void bubble_sort_array(int array_length, int array[]);

int array[] = {1, 4, 3, 6, 8, 2, 5, 7};

int main()
{
    
    int array_length = (int) (sizeof(array) / sizeof(array[0]));

    printf("Original array:\n");
    print_array(array_length, array);

    bubble_sort_array(array_length, array);

    printf("Sorted array:\n");
    print_array(array_length, array);

    return 0;
}

void print_array(int array_length, int array[])
{
    for (int i = 0; i < array_length - 1; i++)
    {
        printf("%i, ", array[i]);
    }
    printf("%i\n", array[array_length - 1]);
    return;
}

void bubble_sort_array(int array_length, int array[])
{
    for (int i = 0; i < array_length - 1; i++)
    {
        for (int j = i + 1; j < array_length; j++)
        {
            if (array[i] > array[j])
            {
                // switch elements 
                int temp = array[i];
                array[i] = array[j];
                array[j] = temp;
            }
        }
    }
    return;
}