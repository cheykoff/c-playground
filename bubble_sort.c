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

    printf("\nSorted array:\n");
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
    // Repeat the process of bubbling n - 1 times (max)
    for (int i = 0; i < array_length - 1; i++)
    {
        int n = 0;
        printf("\nThis is the bubbling of the %ith element\n", array_length - i);
        
        // Bubbling the last element of the unsorted array
        for (int j = 0; j < array_length - 1; j++)
        {   
            if (array[j] > array[j + 1])
            {
                // switch elements 
                printf("This switches the %i (Position %i) and %i (Position %i)\n", array[j], j, array[j + 1], j + 1);
                int temp = array[j];
                array[j] = array[j + 1];
                array[j + 1] = temp;
                n++;
            }
        }
        printf("%i arrived at position %i\n", array[array_length - i - 1], array_length - i);
        printf("The array is now:\n");
        print_array(array_length, array);
        
        // If no switch happens we know that the array is already sorted.
        if (n == 0)
        {
            printf("No more iterations needed. The array is already sorted.\n");
            return;
        }
    }
    return;
}